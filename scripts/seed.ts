/**
 * Seed Script - Bulk ingest procedure data from JSON files into ChromaDB
 * 
 * Usage: npx tsx scripts/seed.ts
 * 
 * Requires:
 * - ChromaDB running (docker-compose up -d chromadb)
 * - OpenAI API key set (OPENAI_API_KEY)
 * - Procedure JSON files in data/seed/
 */

import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { ChromaClient } from 'chromadb';

// These imports work because the script runs from repo root
const { chunkText } = await import('../lib/chunk');
const { embedBatch } = await import('../lib/embed');

const chroma = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });

const collection = await chroma.getOrCreateCollection({
  name: 'procedures',
  metadata: { 'hnsw:space': 'cosine' },
});

const seedDir = path.join(process.cwd(), 'data', 'seed');
const files = (await readdir(seedDir)).filter(f => f.endsWith('.json'));

console.log(`Found ${files.length} procedure files to seed...\n`);

for (const file of files) {
  const p = JSON.parse(await readFile(path.join(seedDir, file), 'utf-8'));

  const fullText = [
    `Title: ${p.title}`,
    `Country: ${p.country}`,
    `Category: ${p.category}`,
    `Summary: ${p.summary}`,
    `Steps:\n${p.steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`,
    `Required documents:\n${p.documents.map((d: string) => `- ${d}`).join('\n')}`,
    `Office: ${p.office}`,
    `Fee: ${p.fee}`,
    `Processing time: ${p.processing_days} day(s)`,
    p.notes ? `Notes: ${p.notes}` : '',
  ].filter(Boolean).join('\n\n');

  const chunks = chunkText(fullText);
  const embeddings = await embedBatch(chunks);
  const ids = chunks.map((_, i) => `${p.procedure_id}-chunk-${i}`);
  const metadatas = chunks.map(() => ({
    country: p.country,
    category: p.category,
    source_url: p.source_url || '',
    language: p.language || 'en',
    procedure_id: p.procedure_id,
    title: p.title,
    difficulty: p.difficulty || 'moderate',
  }));

  await collection.upsert({ ids, documents: chunks, embeddings, metadatas });
  console.log(`✓ ${p.procedure_id} — ${chunks.length} chunks`);

  // Rate limit buffer for OpenAI
  await new Promise(r => setTimeout(r, 600));
}

console.log(`\n✅ Seed complete. ${files.length} procedures ingested.`);
