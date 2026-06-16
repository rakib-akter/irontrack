# STRATUM

**AI Strength + Nutrition + Body Recomposition Platform.**

STRATUM helps people get stronger, build muscle, improve body composition, eat
optimally, and — crucially — understand *why* every recommendation is made.
Every AI suggestion ships with a confidence score, plain‑language reasoning, and
citations drawn from a local research database (never hallucinated).

It is built as a monorepo with a clear service split:

```
stratum/
├── frontend/    Next.js 15 (App Router) · TypeScript · Tailwind · Framer Motion · Recharts
│   └── prisma/  Schema + migrations — single source of truth for the database
├── backend/     FastAPI — AI gateway (OpenRouter, free-first + fallback), research
│                retrieval/citations, heavy analytics endpoints
├── analytics/   Python package — strength & nutrition models (Epley, Brzycki, RIR,
│                rolling averages, plateau detection). Pure, tested, reusable.
├── research/    Curated research summaries → embeddings (pgvector) → citation engine
├── shared/      Cross-cutting contracts shared by frontend & backend
└── docs/        Architecture, roadmap, data model, API reference
```

**Data flow**

```
Browser ─▶ Next.js (Prisma CRUD, Supabase Auth) ─▶ Supabase Postgres
               └────────▶ FastAPI (AI · research · analytics) ─▶ Supabase Postgres
```

Next.js owns transactional CRUD via Prisma. FastAPI is a stateless intelligence
service: it validates the Supabase JWT, runs the analytics models, performs
research retrieval, and calls LLMs through an OpenRouter‑compatible gateway with
free models first and graceful fallback (including a rule‑based mode that needs
no API key).

## Status

Actively being built in phases — see [docs/ROADMAP.md](docs/ROADMAP.md). The app
is kept functional at every step. Architecture and the strength/analytics engine
come first; the premium UI and remaining pillars follow.

## Quick start

Prerequisites: Node 20+, Python 3.11+, a Supabase project.

```bash
# Frontend
cd frontend
npm install
cp .env.example .env   # fill in Supabase + DB URLs
npx prisma migrate dev
npm run dev             # http://localhost:3000

# Backend (separate terminal)
cd backend
python -m venv .venv && . .venv/Scripts/activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000          # http://localhost:8000/docs
```

> On a machine with a TLS-intercepting proxy/AV, prefix Node commands with
> `NODE_OPTIONS=--use-system-ca` and install pip packages with
> `pip install --use-feature=truststore -r requirements.txt`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design.
