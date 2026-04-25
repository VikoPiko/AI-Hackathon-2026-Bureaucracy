import { ChromaClient, IncludeEnum, type Where } from 'chromadb';
import { embedText } from './embed';

let chromaInstance: ChromaClient | null = null;

export interface ProcedureChunkMetadata {
  country?: string;
  category?: string;
  source_url?: string;
  language?: string;
  procedure_id?: string;
  title?: string;
  difficulty?: string;
}

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

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 2);
}

function getLexicalScore(question: string, metadata: ProcedureChunkMetadata, chunk: string): number {
  const queryTokens = new Set(tokenize(question));
  if (queryTokens.size === 0) {
    return 0;
  }

  const haystackTokens = new Set(
    tokenize(`${metadata.title || ''} ${metadata.category || ''} ${chunk.slice(0, 600)}`),
  );
  let hits = 0;
  queryTokens.forEach((token) => {
    if (haystackTokens.has(token)) {
      hits += 1;
    }
  });

  return hits / queryTokens.size;
}

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
  try {
    const collection = await getProceduresCollection();
    const embedding = await embedText(question);

    const results = await collection.query({
      queryEmbeddings: [embedding],
      nResults: Math.max(topK * 2, topK),
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

      const itemMetadata = metadata[index] || {};
      const distance = distances[index] ?? 1;
      const vectorScore = 1 - Math.min(distance, 2) / 2;
      const lexicalScore = getLexicalScore(question, itemMetadata, chunk);

      return [
        {
          chunk,
          source: itemMetadata.source_url || '',
          distance,
          metadata: itemMetadata,
          rankingScore: vectorScore * 0.8 + lexicalScore * 0.2,
        },
      ];
    });
    const rankedEntries = entries
      .sort((a, b) => b.rankingScore - a.rankingScore)
      .slice(0, topK);

    return {
      chunks: rankedEntries.map((entry) => entry.chunk),
      sources: rankedEntries.map((entry) => entry.source),
      distances: rankedEntries.map((entry) => entry.distance),
      metadata: rankedEntries.map((entry) => entry.metadata),
    };
  } catch (error) {
    console.warn('[RAG] ChromaDB unavailable, returning empty context:', error);
    return {
      chunks: [],
      sources: [],
      distances: [],
      metadata: [],
    };
  }
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
}

export function getConfidence(distances: number[]): number {
  if (!distances.length) {
    return 0.5;
  }

  // Chroma cosine distance is typically in the 0..2 range.
  // Convert it into a softer 0..1 confidence score for prompting.
  const best = 1 - Math.min(...distances) / 2;
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
    const collection = await getProceduresCollection();
    return {
      name: collection.name,
      dimension: collection.metadata?.dimension,
      count: await collection.count(),
    };
  } catch {
    return null;
  }
}

export { GET_INCLUDE };
