import { generateObject } from 'ai';
import { z } from 'zod';
import { getModelId } from '@/lib/ai/providers';
import { SupportedCountryInputSchema } from '@/lib/ai/request-schemas';
import { buildCompareSystemPrompt } from '@/lib/prompts';
import { retrieveContext, buildContext, getConfidence } from '@/lib/rag';
import {
  CountryComparisonSchema,
  COUNTRY_NAMES,
  type Country,
} from '@/lib/types';

const compareRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  countries: z
    .array(SupportedCountryInputSchema)
    .min(1)
    .max(6)
    .default(['DE', 'NL', 'PT', 'ES']),
});

export async function POST(req: Request) {
  try {
    const payload = compareRequestSchema.safeParse(await req.json());
    if (!payload.success) {
      return Response.json(
        {
          error: 'Invalid request payload',
          details: payload.error.flatten(),
        },
        { status: 400 },
      );
    }

    const normalizedCountries = Array.from(
      new Set(payload.data.countries),
    ) as Country[];

    const { question } = payload.data;

    const contextByCountry = await Promise.all(
      normalizedCountries.map(async (code) => {
        const { chunks, sources, distances, metadata } = await retrieveContext(
          question,
          code,
          3,
        );
        return {
          code,
          name: COUNTRY_NAMES[code] || code,
          context: buildContext(chunks, sources, metadata),
          confidence: getConfidence(distances),
          hasContext: chunks.length > 0,
        };
      }),
    );

    const groundedCountries = contextByCountry.filter(
      (country) => country.hasContext && country.confidence >= 0.2,
    );
    const omittedCountries = contextByCountry.filter(
      (country) => !country.hasContext || country.confidence < 0.2,
    );

    if (groundedCountries.length === 0) {
      return Response.json({
        question_interpreted: question,
        countries: [],
        recommendation:
          'I do not have enough official source context to compare these countries reliably yet. Please narrow the question or verify on official government websites.',
      });
    }

    const contextBlock = groundedCountries
      .map(
        (country) => `=== ${country.name} (${country.code}) ===\n${country.context}`,
      )
      .join('\n\n');

    const { object } = await generateObject({
      model: getModelId(),
      schema: CountryComparisonSchema,
      system: buildCompareSystemPrompt(),
      prompt: `Comparison question: ${question}

Countries to compare: ${groundedCountries
        .map((country) => country.code)
        .join(', ')}
${omittedCountries.length ? `\nCountries with insufficient official context: ${omittedCountries.map((country) => country.code).join(', ')}` : ''}

Context from official sources per country:
${contextBlock}`,
    });

    return Response.json(object);
  } catch (error) {
    console.error('Compare route error:', error);
    return Response.json(
      { error: 'Failed to compare countries' },
      { status: 500 },
    );
  }
}
