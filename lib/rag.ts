<<<<<<< HEAD
import { ChromaClient, IncludeEnum } from 'chromadb';
=======
import { ChromaClient, IncludeEnum, type Where } from 'chromadb';
>>>>>>> 5dadaf69ccce5226d7f9711b608c03a8fcb97844
import { embedText } from './embed';

let chromaInstance: ChromaClient | null = null;

<<<<<<< HEAD
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
=======
export interface ProcedureChunkMetadata {
>>>>>>> 5dadaf69ccce5226d7f9711b608c03a8fcb97844
  country?: string;
  category?: string;
  source_url?: string;
  language?: string;
  procedure_id?: string;
  title?: string;
  difficulty?: string;
}

<<<<<<< HEAD
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
=======
export interface RetrievedContext {
  chunks: string[];
  sources: string[];
  distances: number[];
  metadata: ProcedureChunkMetadata[];
}

const PROCEDURES_COLLECTION = 'procedures';

const QUERY_INCLUDE = [
  IncludeEnum.Documents,
  IncludeEnum.Metadatas,
  IncludeEnum.Distances,
] as const;

const GET_INCLUDE = [IncludeEnum.Metadatas] as const;

export function getChromaClient(): ChromaClient {
  if (!chromaInstance) {
    chromaInstance = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000',
    });
  }

  return chromaInstance;
}

export async function getProceduresCollection() {
  const chroma = getChromaClient();

  return chroma.getOrCreateCollection({
    name: PROCEDURES_COLLECTION,
    metadata: { 'hnsw:space': 'cosine' },
  });
}

function buildProcedureWhere(country: string, category?: string): Where {
  if (!category) {
    return {
      country: { $eq: country },
    };
  }

  return {
    $and: [
      { country: { $eq: country } },
      { category: { $eq: category } },
    ],
  };
}

export async function retrieveContext(
  question: string,
  country: string,
  topK = 6,
  category?: string,
): Promise<RetrievedContext> {
  const collection = await getProceduresCollection();
  const embedding = await embedText(question);

  const results = await collection.query({
    queryEmbeddings: [embedding],
    nResults: topK,
    where: buildProcedureWhere(country, category),
    include: [...QUERY_INCLUDE],
  });

  const documents = (results.documents?.[0] || []) as (string | null)[];
  const metadata = (results.metadatas?.[0] || []) as (ProcedureChunkMetadata | null)[];
  const distances = (results.distances?.[0] || []) as number[];

  const entries = documents.flatMap((chunk, index) => {
    if (!chunk) {
      return [];
    }

    return [
      {
        chunk,
        source: metadata[index]?.source_url || '',
        distance: distances[index] ?? 1,
        metadata: metadata[index] || {},
      },
    ];
  });

  return {
    chunks: entries.map((entry) => entry.chunk),
    sources: entries.map((entry) => entry.source),
    distances: entries.map((entry) => entry.distance),
    metadata: entries.map((entry) => entry.metadata),
  };
}

export function buildContext(
  chunks: string[],
  sources: string[],
  metadata: ProcedureChunkMetadata[] = [],
): string {
  if (!chunks.length) {
    return 'No relevant context found in the knowledge base.';
  }

  return chunks
    .map((chunk, index) => {
      const item = metadata[index];
      const heading = [
        item?.title ? `[Procedure: ${item.title}]` : null,
        item?.category ? `[Category: ${item.category}]` : null,
        sources[index] ? `[Source: ${sources[index]}]` : '[Source: Unknown]',
      ]
        .filter(Boolean)
        .join('\n');

      return `${heading}\n${chunk}`;
    })
    .join('\n\n---\n\n');
>>>>>>> 5dadaf69ccce5226d7f9711b608c03a8fcb97844
}

export function getConfidence(distances: number[]): number {
  if (!distances.length) {
    return 0;
  }

  const best = 1 - Math.min(...distances);
  return Math.max(0, Math.min(1, best));
}

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

export async function getCollectionStats() {
  try {
<<<<<<< HEAD
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
=======
    const collection = await getProceduresCollection();
    return {
      name: collection.name,
      dimension: collection.metadata?.dimension,
      count: collection.metadata?.numElements,
    };
>>>>>>> 5dadaf69ccce5226d7f9711b608c03a8fcb97844
  } catch {
    return null;
  }
}

<<<<<<< HEAD
/**
 * Reset ChromaDB connection (useful when URL changes)
 */
export function resetChromaClient(): void {
  chromaInstance = null;
}
=======
export { GET_INCLUDE };
>>>>>>> 5dadaf69ccce5226d7f9711b608c03a8fcb97844
