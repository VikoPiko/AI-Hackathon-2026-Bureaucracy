import { generateObject } from 'ai';
import { getModelId } from '@/lib/ai/providers';
import { CountryComparisonSchema, COUNTRY_NAMES } from '@/lib/types';
import { retrieveContext, buildContext } from '@/lib/rag';

export async function POST(req: Request) {
  const { question, countries = ['DE', 'NL', 'PT', 'ES'] } = await req.json();

  const contextByCountry = await Promise.all(
    countries.map(async (code: string) => {
      const { chunks, sources } = await retrieveContext(question, code, 3);
      return {
        code,
        name: COUNTRY_NAMES[code] || code,
        context: buildContext(chunks, sources),
      };
    }),
  );

  const contextBlock = contextByCountry
    .map((country) => `=== ${country.name} (${country.code}) ===\n${country.context}`)
    .join('\n\n');

  const { object } = await generateObject({
    model: getModelId(),
    schema: CountryComparisonSchema,
    system: `You are an expert in European immigration, residency, and relocation law.
Compare how different countries handle the same situation for someone relocating internationally.

Use the provided context for country-specific facts.
Fill gaps with accurate general knowledge about each country's procedures.
Be objective and genuinely useful - honest advantages AND disadvantages for each.
End with a clear recommendation that considers the question's implied priorities (speed, cost, ease, etc.).

difficulty rating: easy = straightforward process, mostly online, clear requirements |
moderate = several steps, some in-person visits, some bureaucracy |
complex = lengthy process, many documents, uncertain timelines, language barriers significant.

Output ONLY the JSON object. No preamble. No markdown.`,
    prompt: `Comparison question: ${question}

Countries to compare: ${countries.join(', ')}

Context from official sources per country:
${contextBlock}`,
  });

  return Response.json(object);
}
