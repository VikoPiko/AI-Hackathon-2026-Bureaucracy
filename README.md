# AI-Hackathon-2026

## Sirma KB CLI (Embedding Pipeline)

Use the helper script at `scripts/sirma-kb.ts` to manage Knowledge Base embedding flow end-to-end.

Prerequisites:

- `.env.local` has `SIRMA_API_KEY` and either `SIRMA_BASE_URL` or `SIRMA_AI_DOMAIN`
- Run commands from repo root

Examples:

```powershell
npx tsx scripts/sirma-kb.ts providers
npx tsx scripts/sirma-kb.ts list
```

```powershell
npx tsx scripts/sirma-kb.ts create --project-id 295 --name "Dev1 KB" --llm-config-id 1611 --embedding-model-id gemini-embedding-001
```

```powershell
npx tsx scripts/sirma-kb.ts upload --vector-store-id <VECTOR_STORE_ID> --file data/data.md
# external: npx tsx scripts/sirma-kb.ts upload --vector-store-id <VECTOR_STORE_ID> --file C:\Users\PC\Downloads\data.md
npx tsx scripts/sirma-kb.ts files --vector-store-id <VECTOR_STORE_ID>
```

## AI Routes Tests

- Create python venv
- run:

```bash
pip install -r requirements.txt
npm run dev
python scripts/run_dev2_routes.py
pytest tests/test_dev2_routes.py
```

## Agent Settings

### Basic information

- Name: `Bureaucracy Assistant`
- Description: Helps with questions regarding bureaucracy. Keeps in mind the user might be from country A and wants to fill in documents or gain knowleadge about bureaucracy from country B. The agent must inform them correctly and must follow all regulations.
Translates BG/DE/FR and other languages to the language in which the user asked the question, then simplifies the data into plain language, Extracts the data (deadlines, actions from the doc, etc), creates a draft - replying to a template. Follows EUR-Lex and national regulations. Returns the answer in the same language as the users question.
- Add Name to Context (Adds the name of the agent to the agent instructions): `True`
- Add Datetime to Context (Adds the current date and time to the agent instructions): `True`

### Model Configuration

- Primary Model: `Google Gemini 3 Flash Preview`
- Failover Model: `OpenAI GPT-4.1 Nano`
- Temperature: `0.7`
- Max Output Tokens: `65535`
- Thinking Level: `High`

### Memory and storage

- Enable User Memories: `True`
- Enable Agentic Memory: `True`
- Add History to Context: `True`
- History Runs: `5`
- Add Read Chat History Tool: `False`
- Enable Sessions Summaries: `False`

### Knowledge Base

- Agentic RAG: `True`
- HyDE Retrieval: `False`
- Used files - `data/data.md` and `data/seed/*`

### Advanced Settings

- Enable Markdown (Format agent responses as markdown): `True`
- Enable Structured Output (Constrain agent responses to a defined JSON schema): `False`
