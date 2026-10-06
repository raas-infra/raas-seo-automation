# SEO Market Research Automation

Foundation for an SEO market research automation tool. Currently only project
structure and configuration exist; no SEO, crawling, SERP, LLM or database
functionality is implemented yet.

## Planned stack

- Python, Trafilatura (crawling/extraction), Playwright (only if needed)
- OpenRouter for LLM access (model configurable via `LLM_MODEL`)
- Pydantic + Pydantic Settings
- SQLite first, replaceable database layer (Supabase/PostgreSQL later)
- Configurable SERP provider
- JSON output
- Astro/TypeScript frontend (later)

## Setup

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # Windows: copy .env.example .env
```

Fill in `.env` locally. Never commit `.env`.

## Run

```bash
python -m src.main
```

## Frontend (Phase 1 dashboard)

Astro + TypeScript + React + MUI, in `frontend/`. Uses local mock data only
(stored in the browser's localStorage) — no backend required yet.

```bash
cd frontend
npm install
npm run dev        # http://localhost:4321
npm run build      # type check + static build to frontend/dist
```

Flow: Dashboard → Create Project → Project Details → Start Research →
Research Run (`RUNNING` → `COMPLETED`, ~12s simulated) → SEO Results.
"Reset demo data" on the Dashboard restores the seed projects.

All data access goes through `frontend/src/lib/api/client.ts`, so the mock
client can later be swapped for a FastAPI-backed client without touching pages.

### Frontend tests (Playwright)

End-to-end tests live in `frontend/tests/e2e/` and run against a production
build served on port 4322 (started automatically).

```bash
cd frontend
npx playwright install chromium   # once per machine
npm run test:e2e                  # run all tests (~1 min)
npm run test:e2e:ui               # interactive runner
npm run test:e2e:report           # open the last HTML report
```

Tests marked `test.fail(...)` document known bugs; Playwright reports them as
failures once the bug is fixed, as a reminder to remove the marker.

**Pre-commit hook:** runs `astro check` and the e2e tests whenever files under
`frontend/` are staged. Enable it once per clone:

```bash
git config core.hooksPath .githooks
```

## Layout

```
frontend/       Astro dashboard (mock data for now)
src/config/     settings (Pydantic Settings)
src/crawler/    page fetching/extraction (later)
src/serp/       SERP providers (later)
src/ai/         OpenRouter LLM client (later)
src/analysis/   market analysis (later)
src/database/   storage layer (later)
src/models/     Pydantic models (later)
tests/
```
