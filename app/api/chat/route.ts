import { streamObject } from 'ai';
import { getModelId } from '@/lib/ai/providers';
import { retrieveContext, buildContext, getConfidence } from '@/lib/rag';
import { ProcedureAnswerSchema, COUNTRY_NAMES } from '@/lib/types';

export const maxDuration = 10;

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  de: 'German',
  nl: 'Dutch',
  pt: 'Portuguese',
  es: 'Spanish',
  fr: 'French',
  bg: 'Bulgarian',
  tr: 'Turkish',
};

function chatSystemPrompt(language: string, country: string): string {
  return `You are an expert bureaucracy navigator specializing in ${
    COUNTRY_NAMES[country] || country
  }.
You help expats, foreign nationals, and locals navigate official government procedures.
Your users are often stressed: moving abroad, language barriers, unsure of their legal rights.

RULES - never violate these:
1. Only use information from the provided context. Never invent procedures, document names, fees, or office names.
2. If context is insufficient: answerable=false, confidence below 0.4, summary states this clearly.
3. Every step must name the exact office, what to bring, and what to do there.
4. Always include the official local-language name of documents and offices in parentheses.
5. If any step requires speaking the local language, say so and suggest bringing a translator.
6. Fee: if free -> 'Free (gratis)'. If unknown -> null.
7. Confidence scale: 0.85-1.0 = complete answer | 0.5-0.85 = partial | below 0.5 = insufficient.
8. Respond entirely in ${LANG_NAMES[language] || 'English'}.

Output ONLY the JSON object. No preamble. No markdown fences.`;
}

export async function POST(req: Request) {
  const { question, language = 'en', country = 'DE' } = await req.json();

  const { chunks, sources, distances } = await retrieveContext(
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
    system: chatSystemPrompt(language, country),
    prompt: `Question: ${question}

Context from official ${COUNTRY_NAMES[country] || country} sources:
${buildContext(chunks, sources)}`,
  });

  return result.toTextStreamResponse();
}
