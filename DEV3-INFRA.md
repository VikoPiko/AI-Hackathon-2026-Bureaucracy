# Dev 3 - Infrastructure & Ingest Pipeline

## Overview

Infrastructure ownership in this repo covers:
- ChromaDB vector database setup (local + Railway)
- ingest pipeline (`text_override` and `file_url`)
- embedding client and retry behavior
- procedures listing and infra health checks
- upload-to-ingest integration path

## Canonical Local Run Order

```bash
npm install
docker-compose up -d chromadb

# optional bootstrap helper
npx tsx scripts/setup.ts

# infra checks
npx tsx scripts/test-infra.ts

# requires OPENAI_API_KEY or SIRMA_API_KEY
npx tsx scripts/seed.ts

npm run dev
```

Expected signals:
- Chroma container starts and stays healthy
- `npx tsx scripts/test-infra.ts` reports Chroma as `UP`
- `GET /api/health` returns `200` and `services.chromadb.status = "up"`

## Railway ChromaDB

```bash
set CHROMA_URL=https://your-chroma.railway.app
npx tsx scripts/test-infra.ts
```

## Key API Endpoints

### Health
```bash
GET /api/health
```

### Ingest
```bash
POST /api/ingest
Content-Type: application/json

{
  "text_override": "Long enough text to create chunks",
  // OR
  "file_url": "https://example.com/doc.pdf",
  "metadata": {
    "country": "DE",
    "category": "residence_permit",
    "title": "EU Blue Card",
    "source_url": "https://...",
    "procedure_id": "de-residence-eu-blue-card"
  }
}
```

Notes:
- Ingest accepts both `text_override` and `file_url`.
- Upload-triggered ingest includes a short wait before fetching the file URL to reduce race failures.
- Custom `metadata.procedure_id` creates deterministic chunk IDs (`{procedure_id}-chunk-{n}`), improving idempotency for repeat uploads.

### List Procedures
```bash
GET /api/procedures?country=DE&category=residence_permit
```

### Delete Procedure
```bash
DELETE /api/ingest?procedure_id=de-residence-eu-blue-card
```

## Environment Variables

### Minimum
```bash
CHROMA_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Required for full functionality
```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
UPLOADTHING_SECRET=sk_live_...
NEXT_PUBLIC_UPLOADTHING_APP_ID=...
NEXT_PUBLIC_DEMO_MODE=true
```

### Optional embedding provider override
```bash
SIRMA_API_KEY=...
SIRMA_AI_DOMAIN=...
SIRMA_BASE_URL=...
SIRMA_EMBEDDING_MODEL=...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

## Dev 3 Smoke Checklist

Run before opening or merging a Dev 3 PR:
- `npm run build` succeeds
- `docker-compose up -d chromadb` succeeds
- `GET /api/health` returns `200` and Chroma `up`
- `POST /api/ingest` with `text_override` returns success for realistic-length text
- `POST /api/ingest` with `file_url` returns success when embedding key is configured
- `GET /api/procedures` includes ingested `procedure_id`
- `DELETE /api/ingest?procedure_id=...` removes the procedure chunks
- `npx tsx scripts/test-infra.ts` passes (provider checks require valid API keys)

## Troubleshooting

### ChromaDB
```bash
docker ps
docker-compose logs chromadb
docker-compose restart chromadb
```

### Embeddings
- Ensure `OPENAI_API_KEY` or `SIRMA_API_KEY` is configured
- Verify provider quota and rate limits
- Check network access from the Next.js runtime

### Seed data
- Ensure JSON in `data/seed/` is valid
- Ensure `procedure_id` values are unique
- Use valid country/category metadata values

## Related Docs

- [Railway Deployment Guide](./RAILWAY-DEPLOYMENT.md)
