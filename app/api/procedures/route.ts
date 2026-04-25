import { ChromaClient, IncludeEnum } from 'chromadb';
import type { ProcedureSummary } from '@/lib/types';

const chroma = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });

/**
 * GET /api/procedures
 * List all procedures from ChromaDB, optionally filtered by country/category
 * 
 * Query params:
 *   country?: string - Filter by country code (e.g., 'DE', 'NL')
 *   category?: string - Filter by category
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  const category = searchParams.get('category');

  const collection = await chroma.getOrCreateCollection({
    name: 'procedures',
    metadata: { 'hnsw:space': 'cosine' },
  });

  const where: Record<string, string> = {};
  if (country) where.country = country;
  if (category) where.category = category;

  const results = await collection.get({
    where: Object.keys(where).length ? where : undefined,
    include: [IncludeEnum.Metadatas],
    limit: 500,
  });

  // Deduplicate by procedure_id, keep one entry per procedure
  const seen = new Map<string, ProcedureSummary>();
  ((results.metadatas || []) as any[]).forEach(m => {
    if (m?.procedure_id && !seen.has(m.procedure_id)) {
      seen.set(m.procedure_id, {
        procedure_id: m.procedure_id,
        title: m.title || '',
        category: m.category || '',
        country: m.country || '',
        source_url: m.source_url || '',
        difficulty: m.difficulty || 'moderate',
      });
    }
  });

  return Response.json(Array.from(seen.values()));
}
