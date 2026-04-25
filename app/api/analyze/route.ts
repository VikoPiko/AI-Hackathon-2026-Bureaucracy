import { generateObject } from 'ai';
import { z } from 'zod';
import { getModelId } from '@/lib/ai/providers';
import {
  SupportedCountryInputSchema,
  SupportedLanguageInputSchema,
  normalizeDocumentType,
} from '@/lib/ai/request-schemas';
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
    language: SupportedLanguageInputSchema.default('en'),
  })
  .refine((data) => Boolean(data.text || data.file_url), {
    message: 'Either text or file_url is required',
    path: ['text'],
  });

export async function POST(req: Request) {
  try {
    const payload = analyzeRequestSchema.safeParse(await req.json());
    if (!payload.success) {
      return Response.json(
        {
          error: 'Invalid request payload',
          details: payload.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { text, file_url, document_type, country, language } = payload.data;

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
      model: getModelId(),
      schema: DocumentRiskSchema,
      system: buildAnalyzeSystemPrompt(country, document_type, language),
      prompt: `Document type: ${document_type}
Country jurisdiction: ${COUNTRY_NAMES[country] || country}

Document text:
${documentText.slice(0, 10000)}`,
    });

    return Response.json(object);
  } catch (error) {
    console.error('Analyze route error:', error);
    return Response.json(
      { error: 'Failed to analyze document' },
      { status: 500 },
    );
  }
}
