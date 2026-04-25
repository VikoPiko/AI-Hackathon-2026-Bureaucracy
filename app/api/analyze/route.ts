import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  SupportedCountryInputSchema,
  normalizeDocumentType,
} from '@/lib/ai/request-schemas';
import {
  buildDocumentCitations,
  pickOfficialSourceUrl,
} from '@/lib/ai/source-citations';
import { getGovernmentDomains } from '@/lib/ai/gov-web-search';
import { getPromptCacheOptions } from '@/lib/ai/prompt-cache';
import { findCachedDocumentRisk, isDemoMode } from '@/lib/cached-answers';
import { extractTextFromFile, extractTextFromUrl } from '@/lib/extract';
import { buildAnalyzeSystemPrompt } from '@/lib/prompts';
import { COUNTRY_NAMES, DocumentRiskModelSchema } from '@/lib/types';
import { z } from 'zod';

const ANALYZE_MODEL = process.env.OPENAI_ANALYZE_MODEL || 'gpt-5.4';

function supportsTemperatureControl(modelId: string): boolean {
  return !/^gpt-5($|-)/.test(modelId);
}

const analyzeRequestSchema = z
  .object({
    question: z.string().trim().max(500).optional(),
    text: z.string().trim().min(1).optional(),
    file_url: z.string().url().optional(),
    document_type: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .transform(normalizeDocumentType)
      .default('contract'),
    country: SupportedCountryInputSchema.default('DE'),
  });

type ParsedAnalyzeRequest = z.infer<typeof analyzeRequestSchema> & {
  file: File | null;
};

async function parseAnalyzeRequest(req: Request): Promise<ParsedAnalyzeRequest> {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const parsed = analyzeRequestSchema.parse({
      question: form.get('question') || undefined,
      text: form.get('text') || undefined,
      file_url: form.get('file_url') || undefined,
      document_type: form.get('document_type') || 'contract',
      country: form.get('country') || 'DE',
    });
    const file = form.get('file');

    return {
      ...parsed,
      file: file instanceof File && file.size > 0 ? file : null,
    };
  }

  const body = await req.json();
  const parsed = analyzeRequestSchema.parse(body);

  return {
    ...parsed,
    file: null,
  };
}

export async function POST(req: Request) {
  let input: ParsedAnalyzeRequest | null = null;

  try {
    input = await parseAnalyzeRequest(req);
    const cached = !input.file
      ? findCachedDocumentRisk(input.document_type, input.country)
      : null;

    if (isDemoMode() && cached) {
      return Response.json(cached);
    }

    let documentText = input.text;

    if (!documentText && input.file) {
      documentText = await extractTextFromFile(input.file);
    }

    if (!documentText && input.file_url) {
      documentText = await extractTextFromUrl(input.file_url);
    }

    if (!documentText) {
      return Response.json(
        { error: 'Provide document text, a file URL, or upload a file' },
        { status: 400 },
      );
    }

    const promptCache = getPromptCacheOptions({
      modelId: ANALYZE_MODEL,
      family: 'analyze',
      country: input.country,
      documentType: input.document_type,
    });

    const preferredDomains = getGovernmentDomains(input.country) || [];
    const useWebSearch =
      input.document_type === 'official_letter' ||
      /official|authority|letter|notice|deadline|appeal|permit|office/i.test(
        input.question || '',
      );

    let webContext = 'No official or public-service web context was gathered for this review.';
    let webSources: unknown[] = [];

    if (useWebSearch) {
      const searchResult = await generateText({
        model: openai(ANALYZE_MODEL),
        system: `You collect official or public-service context for FormWise document reviews.
Only use web search results that are directly relevant to the user's country and document type.
Summarize grounded facts in 3-5 short bullet sentences.
Do not include URLs in the text.`,
        prompt: `Country: ${COUNTRY_NAMES[input.country] || input.country}
Document type: ${input.document_type}
Review focus: ${input.question || 'General document review'}

Search for official or public-service guidance that helps interpret this document. Prefer office instructions, appointment rules, permit fee pages, payment instructions, rescheduling rules, and document requirements.`,
        tools: {
          web_search: openai.tools.webSearch({
            externalWebAccess: true,
            searchContextSize: 'high',
            userLocation: {
              type: 'approximate',
              country: input.country,
            },
          }),
        },
        toolChoice: { type: 'tool', toolName: 'web_search' } as const,
        ...(supportsTemperatureControl(ANALYZE_MODEL) ? { temperature: 0 } : {}),
        providerOptions: {
          openai: {
            store: false,
            promptCacheKey: `${promptCache.promptCacheKey}:w`,
            promptCacheRetention: promptCache.promptCacheRetention,
          },
        },
      });

      if (searchResult.text.trim().length > 0) {
        webContext = searchResult.text.trim();
      }

      webSources = searchResult.sources;
    }

    const result = await generateText({
      model: openai(ANALYZE_MODEL),
      output: Output.object({ schema: DocumentRiskModelSchema }),
      system: buildAnalyzeSystemPrompt(input.country, input.document_type),
      prompt: `Review focus: ${input.question || 'General document review'}
Document type: ${input.document_type}
Country jurisdiction: ${COUNTRY_NAMES[input.country] || input.country}

Official/public-service web context:
${webContext}

Output priorities:
- stable risk classification
- stable clause identification
- stable missing clause naming
- stable actionable checklist
- ask for missing sections if the excerpt is incomplete
- never include markdown links or raw URLs in summary, verdict, risks, or checklist

Document text:
${documentText.slice(0, 14000)}`,
      ...(supportsTemperatureControl(ANALYZE_MODEL) ? { temperature: 0 } : {}),
      providerOptions: {
        openai: {
          store: false,
          promptCacheKey: promptCache.promptCacheKey,
          promptCacheRetention: promptCache.promptCacheRetention,
        },
      },
    });
    const object = result.output;
    if (!object) {
      throw new Error('No structured output returned');
    }

    const usedSources = buildDocumentCitations({
      preferredDomains,
      uploadedFileName: input.file?.name,
      fileUrl: input.file_url,
      webSources,
    });
    const officialSourceUrl = pickOfficialSourceUrl(
      preferredDomains,
      usedSources.map((item) => item.url),
    );

    return Response.json({
      ...object,
      key_points: object.key_points ?? [
        object.summary,
        ...object.risks.slice(0, 2).map((item) => item.risk),
      ],
      checklist: object.checklist ?? [
        ...object.missing_clauses.map((item) => `Ask for: ${item}`),
        ...object.risks.map((item) => item.recommendation),
      ],
      confidence: object.confidence ?? 0.8,
      needs_more_context: object.needs_more_context ?? false,
      missing_context: object.missing_context ?? [],
      follow_up_questions: object.follow_up_questions ?? [],
      used_sources: officialSourceUrl
        ? usedSources.sort((a, b) => Number(b.is_official) - Number(a.is_official))
        : usedSources,
    });
  } catch (error) {
    console.error('Analyze route error:', error);

    if (input) {
      const cached = !input.file
        ? findCachedDocumentRisk(input.document_type, input.country)
        : null;
      if (cached) {
        return Response.json(cached);
      }
    }

    return Response.json(
      { error: 'Failed to analyze document' },
      { status: 500 },
    );
  }
}
