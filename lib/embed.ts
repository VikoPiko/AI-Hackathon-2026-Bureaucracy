import OpenAI from 'openai';

// Singleton for OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * Generate embedding for a single text with retry logic
 */
export async function embedText(
  text: string, 
  retries = 3, 
  delay = 1000
): Promise<number[]> {
  const openai = getOpenAIClient();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000),
      });
      return res.data[0].embedding;
    } catch (err) {
      lastError = err as Error;
      if (attempt < retries) {
        // Exponential backoff
        await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error('Failed to embed text after retries');
}

/**
 * Generate embeddings for multiple texts in batch with retry logic
 */
export async function embedBatch(
  texts: string[], 
  retries = 3, 
  delay = 1000
): Promise<number[][]> {
  const openai = getOpenAIClient();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts.map(t => t.slice(0, 8000)),
      });
      return res.data.map(d => d.embedding);
    } catch (err) {
      lastError = err as Error;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error('Failed to embed batch after retries');
}

/**
 * Check if OpenAI API is reachable
 */
export async function checkOpenAIHealth(): Promise<boolean> {
  try {
    const openai = getOpenAIClient();
    await openai.models.list();
    return true;
  } catch {
    return false;
  }
}
