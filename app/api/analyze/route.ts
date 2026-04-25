import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  SupportedCountryInputSchema,
  normalizeDocumentType,
} from '@/lib/ai/request-schemas';
import { findCachedDocumentRisk, isDemoMode } from '@/lib/cached-answers';
import { extractTextFromUrl } from '@/lib/extract';
import { buildAnalyzeSystemPrompt } from '@/lib/prompts';
import { DocumentRiskSchema, COUNTRY_NAMES } from '@/lib/types';

const analyzeRequestSchema = z
  .object({
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
  })
  .refine((data) => Boolean(data.text || data.file_url), {
    message: 'Either text or file_url is required',
    path: ['text'],
  });

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
    const payload = analyzeRequestSchema.safeParse(body);
    if (!payload.success) {
      return Response.json(
        {
          error: 'Invalid request payload',
          details: payload.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { text, file_url, document_type, country } = payload.data;
    const cached = findCachedDocumentRisk(document_type, country);

    if (isDemoMode() && cached) {
      return Response.json(cached);
    }

    let documentText = text;
    if (!documentText && file_url) {
      documentText = await extractTextFromUrl(file_url);
    }

    if (!documentText) {
      return Response.json(
        { error: 'No document text provided' },
        { status: 400 },
      );
    }

    const { object } = await generateObject({
      model: openai('gpt-4o') as never,
      schema: DocumentRiskSchema,
      system: buildAnalyzeSystemPrompt(country, document_type),
      prompt: `Document type: ${document_type}
Country jurisdiction: ${COUNTRY_NAMES[country] || country}

Document text:
${documentText.slice(0, 10000)}`,
    });

    return Response.json(object);
  } catch (error) {
    console.error('Analyze route error:', error);
    const fallbackPayload = analyzeRequestSchema.safeParse(body);
    if (fallbackPayload.success) {
      const cached = findCachedDocumentRisk(
        fallbackPayload.data.document_type,
        fallbackPayload.data.country,
      );
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
