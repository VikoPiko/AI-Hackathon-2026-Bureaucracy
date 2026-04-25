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
    await chroma.heartbeat();
    return true;
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
      count: collection.metadata?.numElements,
    };
  } catch {
    return null;
  }
}

export { GET_INCLUDE };
