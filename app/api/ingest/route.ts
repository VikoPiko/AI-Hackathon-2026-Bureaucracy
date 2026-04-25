import { getChromaClient } from '@/lib/rag';
import { extractTextFromUrl } from '@/lib/extract';
import { chunkText } from '@/lib/chunk';
import { embedBatch } from '@/lib/embed';
import { ingestLogger } from '@/lib/logger';

/**
 * POST /api/ingest
 * Ingest a document into ChromaDB for RAG
 * 
 * Body:
 *   file_url?: string - URL to fetch and extract text from
 *   text_override?: string - Direct text to ingest
 *   metadata?: object - Optional metadata fields:
 *     country, category, source_url, language, procedure_id, title, difficulty
 */
export async function POST(req: Request) {
  const { file_url, text_override, metadata } = await req.json();

  try {
    if (!text_override && file_url) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    const text = text_override ?? (file_url ? await extractTextFromUrl(file_url) : null);
    if (!text) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }

    const chunks = chunkText(text);
    const effectiveChunks = chunks.length > 0 && text.trim().length > 0 ? chunks : [text.trim()];
    if (effectiveChunks.length === 0 || effectiveChunks[0].length === 0) {
      return Response.json({ error: 'No content extracted' }, { status: 400 });
    }

    const embeddings = await embedBatch(effectiveChunks);

    const chroma = getChromaClient();
    const collection = await chroma.getOrCreateCollection({
      name: 'procedures',
      metadata: { 'hnsw:space': 'cosine' },
    });

    const ts = Date.now();
    const hasCustomProcedureId = Boolean(metadata?.procedure_id);
    const pid = metadata?.procedure_id || `doc-${ts}`;
    const ids = effectiveChunks.map((_, i) =>
      hasCustomProcedureId ? `${pid}-chunk-${i}` : `${pid}-chunk-${i}-${ts}`,
    );
    const metadatas = effectiveChunks.map(() => ({
      country: metadata?.country || 'DE',
      category: metadata?.category || 'general',
      source_url: metadata?.source_url || file_url || '',
      language: metadata?.language || 'en',
      procedure_id: pid,
      title: metadata?.title || '',
      difficulty: metadata?.difficulty || 'moderate',
    }));

    await collection.upsert({ ids, documents: effectiveChunks, embeddings, metadatas });

    ingestLogger.info('Ingest upsert completed', {
      procedure_id: pid,
      chunks_created: effectiveChunks.length,
      from_file_url: Boolean(file_url),
      has_text_override: Boolean(text_override),
    });

    return Response.json({
      chunks_created: effectiveChunks.length,
      procedure_id: pid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    ingestLogger.error('Ingest failed', {
      message: (error as Error).message,
      file_url,
      procedure_id: metadata?.procedure_id || null,
    });
    return Response.json({ error: 'Ingestion failed' }, { status: 500 });
  }
}

/**
 * DELETE /api/ingest
 * Delete a procedure from ChromaDB by procedure_id
 */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const procedureId = searchParams.get('procedure_id');

  if (!procedureId) {
    return Response.json({ error: 'procedure_id is required' }, { status: 400 });
  }

  try {
    const chroma = getChromaClient();
    const collection = await chroma.getOrCreateCollection({
      name: 'procedures',
      metadata: { 'hnsw:space': 'cosine' },
    });

    await collection.delete({
      where: { procedure_id: procedureId },
    });

    ingestLogger.info('Ingest delete completed', { procedure_id: procedureId });
    return Response.json({ deleted: procedureId });
  } catch (error) {
    ingestLogger.error('Ingest delete failed', {
      message: (error as Error).message,
      procedure_id: procedureId,
    });
    return Response.json({ error: 'Delete failed' }, { status: 500 });
  }
}
