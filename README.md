# BureaucracyAI

## Quick Start

```bash
npm install
docker-compose up -d chromadb
```

Create `.env.local` from `.env.local.example`, then set:
- `OPENAI_API_KEY`
- `UPLOADTHING_SECRET`
- `NEXT_PUBLIC_UPLOADTHING_APP_ID`
- `NEXT_PUBLIC_APP_URL` (default `http://localhost:3000`)
- `CHROMA_URL` (default `http://localhost:8000`)

Optional model overrides:
- `OPENAI_CHAT_MODEL` (default `gpt-5.5`)
- `OPENAI_SEARCH_MODEL` (default `gpt-5.4-mini`)
- `OPENAI_ANALYZE_MODEL` (default `gpt-5.4`)
- `OPENAI_JOURNEY_MODEL` / `OPENAI_COMPARE_MODEL` (default `gpt-5.5`)
- `OPENAI_EMBEDDING_MODEL` (default `text-embedding-3-small`)

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

Run chat quality evals:

```bash
npm run eval:chat
```

## Dev 2 Route Tests

```bash
pip install -r requirements.txt
python scripts/run_dev2_routes.py
pytest tests/test_dev2_routes.py
```

## Dev 3 Runbook

See `DEV3-INFRA.md` for the full infra + ingest lifecycle checklist.
