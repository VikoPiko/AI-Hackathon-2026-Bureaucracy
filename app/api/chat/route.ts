import { generateText, Output, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  SupportedCountryInputSchema,
  SupportedLanguageInputSchema,
} from '@/lib/ai/request-schemas';
import {
  inferLanguageFromText,
  normalizeRequestText,
} from '@/lib/ai/request-utils';
import {
  buildProcedureCitations,
  extractOfficialWebSources,
  pickOfficialSourceUrl,
} from '@/lib/ai/source-citations';
import {
  getGovernmentDomains,
  shouldUseGovernmentWebSearch,
} from '@/lib/ai/gov-web-search';
import { getCachedValue, setCachedValue } from '@/lib/ai/search-context-cache';
import { getPromptCacheOptions } from '@/lib/ai/prompt-cache';
import { findCachedChatAnswer, isDemoMode } from '@/lib/cached-answers';
import { extractTextFromFile } from '@/lib/extract';
import { PROMPT_VERSION, buildChatSystemPrompt } from '@/lib/prompts';
import { buildContext, getConfidence, retrieveContext } from '@/lib/rag';
import {
  COUNTRY_NAMES,
  ProcedureAnswerModelSchema,
  type Language,
  type ProcedureAnswer,
} from '@/lib/types';

export const maxDuration = 30;

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-5.4-mini';
const ANSWER_CACHE_TTL_MS = 1000 * 60 * 60 * 12;

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
  language: SupportedLanguageInputSchema.optional(),
  country: SupportedCountryInputSchema.default('DE'),
  stream: z.boolean().optional().default(true),
});

type ParsedChatRequest = z.infer<typeof chatRequestSchema> & {
  file: File | null;
  language: Language;
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

function resolveChatLanguage(question: string, language?: Language): Language {
  return language || inferLanguageFromText(question);
}

function buildStableQuestionKey(input: Pick<ParsedChatRequest, 'question' | 'country' | 'language'>): string {
  return [
    PROMPT_VERSION,
    input.country,
    input.language,
    normalizeRequestText(input.question),
  ].join(':');
}

function buildAnswerCacheKey(input: ParsedChatRequest): string | null {
  if (input.file) {
    return null;
  }

  return ['chat-answer', buildStableQuestionKey(input)].join(':');
}

async function parseChatRequest(req: Request): Promise<ParsedChatRequest> {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const parsed = chatRequestSchema.parse({
      question: form.get('question'),
      language: form.get('language') || undefined,
      country: form.get('country') || 'DE',
      stream: parseBooleanFormValue(form.get('stream')) ?? true,
    });
    const file = form.get('file');

    return {
      ...parsed,
      language: resolveChatLanguage(parsed.question, parsed.language),
      file: file instanceof File && file.size > 0 ? file : null,
    };
  }

  const body = await req.json();
  const parsed = chatRequestSchema.parse(body);

  return {
    ...parsed,
    language: resolveChatLanguage(parsed.question, parsed.language),
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
    ? `You have access to official government/public-service web search. Use it to confirm the current process, documents, offices, deadlines, fees, and the best official source URL.${preferredDomains ? ` Only use these allowed domains when searching: ${preferredDomains.join(', ')}.` : ''}`
    : 'Use the grounded local context directly and answer cautiously if details are incomplete.'}

Output requirements:
- summary: 2-4 plain-text sentences only
- steps: short action sentences only
- documents: document names only
- key_points: memorable takeaways only
- checklist: concrete actions only
- risks: short concrete risk strings only
- positive_points: short favorable facts only
- missing_clauses: missing facts, protections, or confirmations only
- never include inline citations, markdown links, or raw URLs in summary, steps, key_points, or checklist
- if context is weak, set answerable=false, needs_more_context=true, and ask follow-up questions before trying to complete the task
- if you need more context, keep steps, documents, checklist, risks, positive_points, and missing_clauses empty unless a grounded item is still clearly safe
- source_url: one official URL`;

  return {
    fileText,
    chunks,
    sources,
    metadata,
    preferredDomains,
    prompt,
    ragConfidence,
    useGovernmentSearch,
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
  const needsMoreContext =
    answer.needs_more_context ?? (!answer.answerable || answer.confidence < 0.45);
  const clarificationOnly = needsMoreContext && answer.answerable === false;

  return {
    ...answer,
    key_points: clarificationOnly
      ? []
      : (answer.key_points ?? [
          answer.summary,
          ...(answer.office ? [`Office: ${answer.office}`] : []),
          ...(answer.fee_info ? [`Fee: ${answer.fee_info}`] : []),
        ]),
    checklist: clarificationOnly
      ? []
      : (answer.checklist ?? [
          ...answer.documents.map((item) => `Gather ${item}`),
          ...answer.steps,
        ]),
    steps: clarificationOnly ? [] : answer.steps,
    documents: clarificationOnly ? [] : answer.documents,
    risks: clarificationOnly ? [] : (answer.risks ?? []),
    positive_points: clarificationOnly ? [] : (answer.positive_points ?? []),
    missing_clauses: clarificationOnly
      ? []
      : (answer.missing_clauses ?? answer.missing_context ?? []),
    needs_more_context: needsMoreContext,
    missing_context: answer.missing_context ?? [],
    follow_up_questions: answer.follow_up_questions ?? [],
    source_url: officialSourceUrl,
    used_sources: usedSources,
  };
}

function createCallConfig(
  input: ParsedChatRequest,
  prepared: Awaited<ReturnType<typeof preparePrompt>>,
  officialWebContext: string,
) {
  const promptCache = getPromptCacheOptions({
    modelId: CHAT_MODEL,
    family: 'chat',
    country: input.country,
    language: input.language,
  });
  return {
    model: openai(CHAT_MODEL),
    system: buildChatSystemPrompt(input.language, input.country),
    prompt: `${prepared.prompt}

Official/public-service web context:
${officialWebContext}`,
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

async function gatherOfficialWebContext(
  input: ParsedChatRequest,
  prepared: Awaited<ReturnType<typeof preparePrompt>>,
) {
  if (!prepared.useGovernmentSearch || !prepared.preferredDomains?.length) {
    return {
      context:
        'No extra official web context was used beyond the local knowledge base and any uploaded document.',
      officialSources: [] as Array<{ title: string; url: string }>,
    };
  }

  const cacheKey = ['official-web', buildStableQuestionKey(input)].join(':');
  const cached = getCachedValue<{
    context: string;
    officialSources: Array<{ title: string; url: string }>;
  }>(cacheKey);
  if (cached) {
    return cached;
  }

  const promptCache = getPromptCacheOptions({
    modelId: CHAT_MODEL,
    family: 'chat',
    country: input.country,
    language: input.language,
  });

  const searchResult = await generateText({
    model: openai(CHAT_MODEL),
    prompt: `Question: ${input.question}
Country: ${COUNTRY_NAMES[input.country] || input.country}
Target language: ${input.language}

You are preparing official-only context for a bureaucracy answer.
Only rely on official government or public-service sources from these domains when summarizing:
${prepared.preferredDomains.join(', ')}

If you cannot find relevant official/public-service sources, respond exactly with:
NO_OFFICIAL_CONTEXT

Otherwise, give 4-6 short bullet lines in the target language with only grounded facts useful for the final answer.
Do not include URLs or markdown.`,
    tools: {
      web_search: openai.tools.webSearch({
        externalWebAccess: true,
        searchContextSize: 'high',
        userLocation: {
          type: 'approximate',
          country: input.country,
        },
        filters: {
          allowedDomains: prepared.preferredDomains,
        },
      }),
    },
    toolChoice: { type: 'tool', toolName: 'web_search' } as const,
    ...(supportsTemperatureControl(CHAT_MODEL) ? { temperature: 0 } : {}),
    providerOptions: {
      openai: {
        store: false,
        promptCacheKey: `${promptCache.promptCacheKey}-w`.slice(0, 64),
        promptCacheRetention: promptCache.promptCacheRetention,
      },
    },
  });

  const officialSources = extractOfficialWebSources(
    searchResult.sources,
    prepared.preferredDomains,
  );
  const context =
    officialSources.length > 0 && searchResult.text.trim() !== 'NO_OFFICIAL_CONTEXT'
      ? searchResult.text.trim()
      : 'No additional official web context was confirmed for this request.';

  return setCachedValue(cacheKey, {
    context,
    officialSources,
  });
}

function createSseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function createImmediateStreamResponse(answer: ProcedureAnswer, message: string) {
  const encoder = new TextEncoder();

  const responseStream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(createSseEvent('status', { message })),
      );
      controller.enqueue(encoder.encode(createSseEvent('final', answer)));
      controller.close();
    },
  });

  return new Response(responseStream, {
    headers: streamHeaders,
  });
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

    const answerCacheKey = buildAnswerCacheKey(input);
    const cachedAnswer = answerCacheKey
      ? getCachedValue<ProcedureAnswer>(answerCacheKey)
      : null;

    if (cachedAnswer) {
      if (input.stream) {
        return createImmediateStreamResponse(
          cachedAnswer,
          'Reusing a recent grounded answer for the same request...',
        );
      }

      return Response.json(cachedAnswer);
    }

    if (!input.stream) {
      const prepared = await preparePrompt(input);
      const searchContext = await gatherOfficialWebContext(input, prepared);
      const sharedCall = createCallConfig(input, prepared, searchContext.context);
      const result = await generateText(sharedCall);
      if (!result.output) {
        throw new Error('No structured output returned');
      }

      const finalAnswer = finalizeAnswer(
        result.output,
        searchContext.officialSources,
        input.country,
        prepared,
        input.file?.name,
      );

      if (answerCacheKey) {
        setCachedValue(answerCacheKey, finalAnswer, ANSWER_CACHE_TTL_MS);
      }

      return Response.json(finalAnswer);
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
            const searchContext = await gatherOfficialWebContext(input, prepared);

            if (prepared.useGovernmentSearch) {
              send('status', {
                message: 'Searching official government sources...',
              });
            }

            send('status', {
              message: 'Building your answer...',
            });

            const sharedCall = createCallConfig(input, prepared, searchContext.context);
            const result = streamText(sharedCall);

            for await (const partial of result.partialOutputStream) {
              send('partial', partial);
            }

            const output = await result.output;
            const finalAnswer = finalizeAnswer(
              output as ProcedureAnswer,
              searchContext.officialSources,
              input.country,
              prepared,
              input.file?.name,
            );

            if (answerCacheKey) {
              setCachedValue(answerCacheKey, finalAnswer, ANSWER_CACHE_TTL_MS);
            }

            send('final', finalAnswer);
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
