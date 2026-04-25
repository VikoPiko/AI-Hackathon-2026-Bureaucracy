import { generateObject } from 'ai';
import { getModelId } from '@/lib/ai/providers';
import { RelocationJourneySchema, COUNTRY_NAMES } from '@/lib/types';
import { retrieveContext, buildContext } from '@/lib/rag';

export async function POST(req: Request) {
  const {
    from_country = 'unknown',
    to_country = 'DE',
    nationality,
    purpose = 'work',
    language = 'en',
  } = await req.json();

  const query = `moving to ${to_country} ${purpose} residence permit registration`;
  const { chunks, sources } = await retrieveContext(query, to_country, 8);
  const context = buildContext(chunks, sources);

  const { object } = await generateObject({
    model: getModelId(),
    schema: RelocationJourneySchema,
    system: `You are an expert international relocation advisor.
Create a complete, phased relocation roadmap for someone moving to ${
      COUNTRY_NAMES[to_country] || to_country
    }.
Use the provided context for country-specific procedures. Fill gaps with accurate general knowledge.

Phases (use exactly these names):
1. "Before you leave" - things to do in the home country before departure
2. "First week in ${COUNTRY_NAMES[to_country] || to_country}" - immediate registrations and critical tasks
3. "First month" - permits, banking, healthcare, practical setup
4. "First 3 months" - longer-term requirements and integrations

Urgency:
- critical = legally required or blocks everything else
- important = strongly recommended
- optional = nice to have

Include realistic warnings about the most common mistakes people make in this move.
Respond in ${language === 'en' ? 'English' : language}.
Output ONLY the JSON object. No preamble. No markdown fences.`,
    prompt: `Relocating from: ${from_country}
Nationality: ${nationality || 'not specified'}
Destination: ${COUNTRY_NAMES[to_country] || to_country}
Purpose: ${purpose}

Context from ${COUNTRY_NAMES[to_country] || to_country} official sources:
${context}`,
  });

  return Response.json(object);
}
