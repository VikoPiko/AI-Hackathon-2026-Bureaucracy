import OpenAI from 'openai';
import { OPENAI_EMBEDDING_MODEL } from '@/lib/ai/model-config';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedText(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: OPENAI_EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });

  return res.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: OPENAI_EMBEDDING_MODEL,
    input: texts.map((text) => text.slice(0, 8000)),
  });

  return res.data.map((item) => item.embedding);
}

export async function checkOpenAIHealth(): Promise<boolean> {
  try {
    await openai.models.list();
    return true;
  } catch {
    return false;
  }
}
