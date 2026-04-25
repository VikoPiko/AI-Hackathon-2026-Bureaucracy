import { ChromaClient, IncludeEnum } from 'chromadb';
import { embedText } from './embed';

// Singleton pattern for ChromaDB connection reuse
let chromaInstance: ChromaClient | null = null;

/**
 * Get or create the ChromaDB singleton instance
 * Supports both local (docker) and remote (Railway) URLs
 */
export function getChromaClient(): ChromaClient {
  if (!chromaInstance) {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    
    chromaInstance = new ChromaClient({ 
      path: chromaUrl 
    });
  }
  return chromaInstance;
}

/**
 * Get the current ChromaDB URL being used
 */
export function getChromaUrl(): string {
  return process.env.CHROMA_URL || 'http://localhost:8000';
}

/**
 * Check if ChromaDB is configured for local development
 */
export function isLocalChroma(): boolean {
  const url = getChromaUrl();
  return url.includes('localhost') || url.includes('127.0.0.1');
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
 * Retrieve relevant context chunks from ChromaDB for a question
 */
export async function retrieveContext(
  question: string, 
  country: string, 
  topK = 6,
  category?: string
) {
  const chroma = getChromaClient();
  
  // Get or create collection - ChromaDB v2 API
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
    include: [IncludeEnum.Documents, IncludeEnum.Metadatas, IncludeEnum.Distances],
  });

  return {
    chunks: (results.documents?.[0] || []) as string[],
    sources: ((results.metadatas?.[0] || []) as ChromaMetadata[]).map(m => m?.source_url || ''),
    distances: (results.distances?.[0] || []) as number[],
    metadata: (results.metadatas?.[0] || []) as ChromaMetadata[],
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

/**
 * Check if ChromaDB is reachable
 */
export async function checkChromaHealth(): Promise<boolean> {
  try {
    const chroma = getChromaClient();
    // Heartbeat returns a number (nanoseconds)
    const heartbeat = await chroma.heartbeat();
    return typeof heartbeat === 'number' && heartbeat > 0;
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
    // listCollections returns collection names/IDs (strings in v2)
    const collectionNames = await chroma.listCollections();
    
    if (collectionNames.includes('procedures')) {
      // getOrCreateCollection returns the collection object with name, metadata, etc.
      const collection = await chroma.getOrCreateCollection({
        name: 'procedures',
      });
      return {
        name: collection.name,
        dimension: collection.metadata?.dimension as number | undefined,
        count: collection.metadata?.numElements as number | undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Reset ChromaDB connection (useful when URL changes)
 */
export function resetChromaClient(): void {
  chromaInstance = null;
}
