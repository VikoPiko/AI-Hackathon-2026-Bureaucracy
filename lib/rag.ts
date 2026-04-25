import { ChromaClient } from 'chromadb';
import { embedText } from './embed';

const chroma = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });

/**
 * Retrieve relevant context chunks from ChromaDB for a question
 */
export async function retrieveContext(question: string, country: string, topK = 6) {
  const collection = await chroma.getOrCreateCollection({
    name: 'procedures',
    metadata: { 'hnsw:space': 'cosine' },
  });

  const embedding = await embedText(question);

  const results = await collection.query({
    queryEmbeddings: [embedding],
    nResults: topK,
    where: { country },
    include: ['documents', 'metadatas', 'distances'],
  });

  return {
    chunks: (results.documents[0] || []) as string[],
    sources: ((results.metadatas[0] || []) as any[]).map(m => m?.source_url || ''),
    distances: (results.distances?.[0] || []) as number[],
  };
}

/**
 * Build context string from chunks and sources for LLM prompt
 */
export function buildContext(chunks: string[], sources: string[]): string {
  if (!chunks.length) return 'No relevant context found in the knowledge base.';
  return chunks.map((c, i) => `[Source: ${sources[i] || 'Unknown'}]\n${c}`).join('\n\n---\n\n');
}

/**
 * Calculate confidence score from embedding distances
 * Lower distance = higher similarity = higher confidence
 */
export function getConfidence(distances: number[]): number {
  if (!distances.length) return 0;
  const best = 1 - Math.min(...distances);
  return Math.max(0, Math.min(1, best));
}
