import { generateObject } from 'ai';
import { z } from 'zod';
import { getModelId } from '@/lib/ai/providers';
import { CountryComparisonSchema, COUNTRY_NAMES, type Country } from '@/lib/types';
import { retrieveContext, buildContext, getConfidence } from '@/lib/rag';

const supportedCountries = new Set(Object.keys(COUNTRY_NAMES));

const compareRequestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  countries: z.array(z.string().trim().length(2).toUpperCase()).max(6).default(['DE', 'NL', 'PT', 'ES']),
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
      new Set(payload.data.countries.filter((code) => supportedCountries.has(code))),
    ) as Country[];

    if (normalizedCountries.length === 0) {
      return Response.json(
        { error: 'At least one supported country code is required' },
        { status: 400 },
      );
    }

    const { question } = payload.data;

    const contextByCountry = await Promise.all(
      normalizedCountries.map(async (code) => {
        const { chunks, sources, distances } = await retrieveContext(question, code, 3);
        return {
          code,
          name: COUNTRY_NAMES[code] || code,
          context: buildContext(chunks, sources),
          confidence: getConfidence(distances),
          hasContext: chunks.length > 0,
        };
      }),
    );

    const groundedCountries = contextByCountry.filter(
      (country) => country.hasContext && country.confidence >= 0.2,
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
      .map((country) => `=== ${country.name} (${country.code}) ===\n${country.context}`)
      .join('\n\n');

    const { object } = await generateObject({
      model: getModelId(),
      schema: CountryComparisonSchema,
      system: `You are an expert in European immigration, residency, and relocation law.
Compare how different countries handle the same situation for someone relocating internationally.

Use the provided context for country-specific facts.
Do not invent country-specific processing times, costs, offices, documents, or legal requirements not supported by the context.
If context is incomplete for a country, keep its summary cautious and high-level.
Be objective and genuinely useful - honest advantages AND disadvantages for each.
End with a clear recommendation that considers the question's implied priorities (speed, cost, ease, etc.).

difficulty rating: easy = straightforward process, mostly online, clear requirements |
moderate = several steps, some in-person visits, some bureaucracy |
complex = lengthy process, many documents, uncertain timelines, language barriers significant.

Output ONLY the JSON object. No preamble. No markdown.`,
      prompt: `Comparison question: ${question}

Countries to compare: ${groundedCountries.map((country) => country.code).join(', ')}

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
