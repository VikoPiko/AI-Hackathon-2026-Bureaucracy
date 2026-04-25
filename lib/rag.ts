import { ChromaClient } from 'chromadb';
import { embedText } from './embed';

// Singleton pattern for ChromaDB connection reuse
let chromaInstance: ChromaClient | null = null;

/**
 * Get or create the ChromaDB singleton instance
 */
export function getChromaClient(): ChromaClient {
  if (!chromaInstance) {
    chromaInstance = new ChromaClient({ 
      path: process.env.CHROMA_URL || 'http://localhost:8000' 
    });
  }
  return chromaInstance;
}

/**
 * Retrieve relevant context chunks from ChromaDB for a question
 */
export async function retrieveContext(
  question: string, 
  country: string, 
  topK = 6,
  category?: string
) {
  const chroma = getChromaClient();
  
  const collection = await chroma.getOrCreateCollection({
    name: 'procedures',
    metadata: { 'hnsw:space': 'cosine' },
  });

  const embedding = await embedText(question);

  // Build where clause for filtering
  const where: Record<string, string | Record<string, unknown>> = { country };
  if (category) {
    where.category = category;
  }

  const results = await collection.query({
    queryEmbeddings: [embedding],
    nResults: topK,
    where,
    include: ['documents', 'metadatas', 'distances'],
  });

  return {
    chunks: (results.documents[0] || []) as string[],
    sources: ((results.metadatas[0] || []) as ChromaMetadata[]).map(m => m?.source_url || ''),
    distances: (results.distances?.[0] || []) as number[],
    metadata: (results.metadatas[0] || []) as ChromaMetadata[],
  };
}

// Type for ChromaDB metadata
interface ChromaMetadata {
  country?: string;
  category?: string;
  source_url?: string;
  language?: string;
  procedure_id?: string;
  title?: string;
  difficulty?: string;
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

/**
 * Check if ChromaDB is reachable
 */
export async function checkChromaHealth(): Promise<boolean> {
  try {
    const chroma = getChromaClient();
    await chroma.heartbeat();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get collection stats (useful for debugging/admin)
 */
export async function getCollectionStats() {
  const chroma = getChromaClient();
  
  try {
    const collection = await chroma.getCollection({
      name: 'procedures',
    });
    return {
      name: collection.name,
      dimension: collection.metadata?.dimension,
      count: collection.metadata?.numElements,
    };
  } catch {
    return null;
  }
}
