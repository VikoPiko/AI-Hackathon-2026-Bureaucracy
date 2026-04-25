import { streamObject } from 'ai';
import { z } from 'zod';
import { getModelId } from '@/lib/ai/providers';
import {
  SupportedCountryInputSchema,
  SupportedLanguageInputSchema,
} from '@/lib/ai/request-schemas';
import { buildChatSystemPrompt } from '@/lib/prompts';
import { retrieveContext, buildContext, getConfidence } from '@/lib/rag';
import { ProcedureAnswerSchema, COUNTRY_NAMES } from '@/lib/types';

export const maxDuration = 10;

const chatRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  language: SupportedLanguageInputSchema.default('en'),
  country: SupportedCountryInputSchema.default('DE'),
});

export async function POST(req: Request) {
  try {
    const payload = chatRequestSchema.safeParse(await req.json());
    if (!payload.success) {
      return Response.json(
        {
          error: 'Invalid request payload',
          details: payload.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { question, language, country } = payload.data;
    const { chunks, sources, distances, metadata } = await retrieveContext(
      question,
      country,
    );
    const confidence = getConfidence(distances);

    if (confidence < 0.3 || chunks.length === 0) {
      return Response.json({
        summary: `I don't have specific information about this procedure yet. Please check the official government website for ${
          COUNTRY_NAMES[country] || country
        }.`,
        steps: [],
        documents: [],
        office: null,
        fee_info: null,
        source_url: null,
        confidence,
        answerable: false,
      });
    }

    const result = await streamObject({
      model: getModelId(),
      schema: ProcedureAnswerSchema,
      system: buildChatSystemPrompt(language, country),
      prompt: `Question: ${question}

Context from official ${COUNTRY_NAMES[country] || country} sources:
${buildContext(chunks, sources, metadata)}`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat route error:', error);
    return Response.json(
      { error: 'Failed to generate procedure guidance' },
      { status: 500 },
    );
  }
}
