# BureaucracyAI

## Quick Start

```bash
npm install
docker-compose up -d chromadb
```

Create `.env.local` from `.env.local.example`, then set:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY` (or `SIRMA_API_KEY`)
- `UPLOADTHING_SECRET`
- `NEXT_PUBLIC_UPLOADTHING_APP_ID`
- `NEXT_PUBLIC_APP_URL` (default `http://localhost:3000`)
- `CHROMA_URL` (default `http://localhost:8000`)

Run infra validation:

```bash
npx tsx scripts/test-infra.ts
```

Run seed ingestion (requires embedding key):

```bash
npx tsx scripts/seed.ts
```

Start app:

```bash
npm run dev
```

## Dev 2 Route Tests

```bash
pip install -r requirements.txt
python scripts/run_dev2_routes.py
pytest tests/test_dev2_routes.py
```

## Dev 3 Runbook

See `DEV3-INFRA.md` for the full infra + ingest lifecycle checklist.
