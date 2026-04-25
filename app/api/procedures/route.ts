<<<<<<< HEAD
import { ChromaClient, IncludeEnum } from 'chromadb';
=======
import type { Where } from 'chromadb';
>>>>>>> 5dadaf69ccce5226d7f9711b608c03a8fcb97844
import type { ProcedureSummary } from '@/lib/types';
import { getProceduresCollection, GET_INCLUDE } from '@/lib/rag';

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

  const collection = await getProceduresCollection();

  let where: Where | undefined;
  if (country && category) {
    where = {
      $and: [
        { country: { $eq: country } },
        { category: { $eq: category } },
      ],
    };
  } else if (country) {
    where = { country: { $eq: country } };
  } else if (category) {
    where = { category: { $eq: category } };
  }

  const results = await collection.get({
<<<<<<< HEAD
    where: Object.keys(where).length ? where : undefined,
    include: [IncludeEnum.Metadatas],
=======
    where,
    include: [...GET_INCLUDE],
>>>>>>> 5dadaf69ccce5226d7f9711b608c03a8fcb97844
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
