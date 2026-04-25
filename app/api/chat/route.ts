import { generateText, Output, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  SupportedCountryInputSchema,
  SupportedLanguageInputSchema,
} from '@/lib/ai/request-schemas';
import {
  buildProcedureCitations,
  pickOfficialSourceUrl,
} from '@/lib/ai/source-citations';
import {
  getGovernmentDomains,
  shouldUseGovernmentWebSearch,
} from '@/lib/ai/gov-web-search';
import { getPromptCacheOptions } from '@/lib/ai/prompt-cache';
import { findCachedChatAnswer, isDemoMode } from '@/lib/cached-answers';
import { extractTextFromFile } from '@/lib/extract';
import { buildChatSystemPrompt } from '@/lib/prompts';
import { buildContext, getConfidence, retrieveContext } from '@/lib/rag';
import {
  COUNTRY_NAMES,
  ProcedureAnswerModelSchema,
  type ProcedureAnswer,
} from '@/lib/types';

export const maxDuration = 30;

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-5.4-mini';

function supportsTemperatureControl(modelId: string): boolean {
  return !/^gpt-5($|-)/.test(modelId);
}

const streamHeaders = {
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'Content-Type': 'text/event-stream; charset=utf-8',
};

const chatRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  language: SupportedLanguageInputSchema.default('en'),
  country: SupportedCountryInputSchema.default('DE'),
  stream: z.boolean().optional().default(true),
});

type ParsedChatRequest = z.infer<typeof chatRequestSchema> & {
  file: File | null;
};

function parseBooleanFormValue(value: FormDataEntryValue | null): boolean | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

async function parseChatRequest(req: Request): Promise<ParsedChatRequest> {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const parsed = chatRequestSchema.parse({
      question: form.get('question'),
      language: form.get('language') || 'en',
      country: form.get('country') || 'DE',
      stream: parseBooleanFormValue(form.get('stream')) ?? true,
    });
    const file = form.get('file');

    return {
      ...parsed,
      file: file instanceof File && file.size > 0 ? file : null,
    };
  }

  const body = await req.json();
  const parsed = chatRequestSchema.parse(body);

  return {
    ...parsed,
    file: null,
  };
}

async function preparePrompt(input: ParsedChatRequest) {
  const fileText = input.file ? await extractTextFromFile(input.file) : null;
  const { chunks, sources, distances, metadata } = await retrieveContext(
    input.question,
    input.country,
    8,
  );
  const ragConfidence = getConfidence(distances);
  const preferredDomains = getGovernmentDomains(input.country);
  const useGovernmentSearch = shouldUseGovernmentWebSearch({
    question: input.question,
    ragConfidence,
    ragChunkCount: chunks.length,
    hasDocument: Boolean(fileText),
  });

  const prompt = `Question: ${input.question}

Country: ${COUNTRY_NAMES[input.country] || input.country}

${chunks.length > 0
    ? `Local knowledge base context from official sources:\n${buildContext(
        chunks,
        sources,
        metadata,
      )}`
    : 'Local knowledge base context: none available for this request.'}

${fileText
    ? `Uploaded document excerpt:\n${fileText.slice(0, 12000)}`
    : 'Uploaded document excerpt: none'}

RAG confidence signal: ${ragConfidence.toFixed(2)}
${useGovernmentSearch
    ? `You have access to official/public-service web search. Use it to confirm the current process, documents, offices, deadlines, fees, and the best official source URL.${preferredDomains ? ` Prefer official sites from these domains when relevant: ${preferredDomains.join(', ')}.` : ''}`
    : 'Use the grounded local context directly and answer cautiously if details are incomplete.'}

Output requirements:
- summary: 2-4 plain-text sentences only
- steps: short action sentences only
- documents: document names only
- key_points: memorable takeaways only
- checklist: concrete actions only
- never include inline citations, markdown links, or raw URLs in summary, steps, key_points, or checklist
- if context is weak, set needs_more_context=true and ask follow-up questions
- source_url: one official URL`;

  return {
    fileText,
    chunks,
    sources,
    metadata,
    prompt,
    ragConfidence,
    useGovernmentSearch,
  };
}

function createWebSearchTools(country: string, enabled: boolean) {
  if (!enabled) {
    return undefined;
  }

  return {
    web_search: openai.tools.webSearch({
      externalWebAccess: true,
      searchContextSize: 'high',
      userLocation: {
        type: 'approximate',
        country,
      },
    }),
  };
}

function finalizeAnswer(
  answer: ProcedureAnswer,
  webSources: unknown[],
  country: string,
  prepared: Awaited<ReturnType<typeof preparePrompt>>,
  uploadedFileName?: string | null,
): ProcedureAnswer {
  const usedSources = buildProcedureCitations({
    preferredDomains: getGovernmentDomains(country) || [],
    ragMetadata: prepared.metadata,
    ragSourceUrls: prepared.sources,
    webSources,
    uploadedFileName,
  }).sort((a, b) => Number(b.is_official) - Number(a.is_official));
  const officialSourceUrl =
    pickOfficialSourceUrl(
      getGovernmentDomains(country) || [],
      [
        answer.source_url,
        ...prepared.sources,
        ...usedSources.map((item) => item.url),
      ],
    );

  return {
    ...answer,
    key_points: answer.key_points ?? [
      answer.summary,
      ...(answer.office ? [`Office: ${answer.office}`] : []),
      ...(answer.fee_info ? [`Fee: ${answer.fee_info}`] : []),
    ],
    checklist: answer.checklist ?? [
      ...answer.documents.map((item) => `Gather ${item}`),
      ...answer.steps,
    ],
    needs_more_context:
      answer.needs_more_context ?? (!answer.answerable || answer.confidence < 0.45),
    missing_context: answer.missing_context ?? [],
    follow_up_questions: answer.follow_up_questions ?? [],
    source_url: officialSourceUrl,
    used_sources: usedSources,
  };
}

function createCallConfig(
  input: ParsedChatRequest,
  prepared: Awaited<ReturnType<typeof preparePrompt>>,
) {
  const promptCache = getPromptCacheOptions({
    modelId: CHAT_MODEL,
    family: 'chat',
    country: input.country,
    language: input.language,
  });
  const tools = createWebSearchTools(input.country, prepared.useGovernmentSearch);
  const toolChoice = prepared.useGovernmentSearch
    ? ({ type: 'tool', toolName: 'web_search' } as const)
    : undefined;

  return {
    model: openai(CHAT_MODEL),
    system: buildChatSystemPrompt(input.language, input.country),
    prompt: prepared.prompt,
    tools,
    toolChoice,
    output: Output.object({ schema: ProcedureAnswerModelSchema }),
    ...(supportsTemperatureControl(CHAT_MODEL) ? { temperature: 0 } : {}),
    providerOptions: {
      openai: {
        store: false,
        promptCacheKey: promptCache.promptCacheKey,
        promptCacheRetention: promptCache.promptCacheRetention,
      },
    },
  } as const;
}

function createSseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  try {
    const input = await parseChatRequest(req);
    const cached = !input.file
      ? findCachedChatAnswer(input.question, input.country)
      : null;

    if (isDemoMode() && cached) {
      return Response.json(cached);
    }

    if (!input.stream) {
      const prepared = await preparePrompt(input);
      const sharedCall = createCallConfig(input, prepared);
      const result = await generateText(sharedCall);
      if (!result.output) {
        throw new Error('No structured output returned');
      }

      return Response.json(
        finalizeAnswer(
          result.output,
          result.sources,
          input.country,
          prepared,
          input.file?.name,
        ),
      );
    }

    const encoder = new TextEncoder();

    const responseStream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(createSseEvent(event, data)));
        };

        const run = async () => {
          try {
            send('status', {
              message: input.file
                ? 'Reading your attached document...'
                : 'Searching the saved knowledge base...',
            });

            const prepared = await preparePrompt(input);

            if (prepared.useGovernmentSearch) {
              send('status', {
                message: 'Searching official government sources...',
              });
            }

            send('status', {
              message: 'Building your answer...',
            });

            const sharedCall = createCallConfig(input, prepared);
            const result = streamText(sharedCall);

            for await (const partial of result.partialOutputStream) {
              send('partial', partial);
            }

            const [output, sources] = await Promise.all([
              result.output,
              result.sources,
            ]);

            send(
              'final',
              finalizeAnswer(
                output as ProcedureAnswer,
                sources,
                input.country,
                prepared,
                input.file?.name,
              ),
            );
          } catch (error) {
            console.error('Chat stream error:', error);
            send('error', {
              message:
                error instanceof Error
                  ? error.message
                  : 'Failed to generate procedure guidance',
            });
          } finally {
            controller.close();
          }
        };

        void run();
      },
    });

    return new Response(responseStream, {
      headers: streamHeaders,
    });
  } catch (error) {
    console.error('Chat route error:', error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate procedure guidance',
      },
      { status: 500 },
    );
  }
}
