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

## Layout

```
src/config/     settings (Pydantic Settings)
src/crawler/    page fetching/extraction (later)
src/serp/       SERP providers (later)
src/ai/         OpenRouter LLM client (later)
src/analysis/   market analysis (later)
src/database/   storage layer (later)
src/models/     Pydantic models (later)
tests/
```
