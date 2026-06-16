# STRATUM — Architecture

## 1. System overview

STRATUM is a monorepo with two runtimes over one database:

| Service | Tech | Responsibility |
|---|---|---|
| `frontend` | Next.js 15 App Router, TS, Tailwind, Framer Motion, Recharts | UI, transactional CRUD via Prisma, Supabase Auth session |
| `backend` | FastAPI (Python 3.11) | AI gateway, research retrieval/citations, heavy analytics |
| `analytics` | Python package | Pure strength/nutrition models (no I/O) |
| `research` | Markdown + ingestion scripts | Research summaries → embeddings → citation source |
| DB | Supabase Postgres (+ `pgvector`) | All persistent state |

```
                 ┌────────────────────────────┐
   Browser  ───▶ │  Next.js (frontend/)        │
                 │  • Supabase Auth (cookies)  │
                 │  • Prisma CRUD              │──▶ Supabase Postgres
                 │  • calls backend for AI     │        ▲
                 └──────────────┬──────────────┘        │
                                │ JWT (Supabase)        │
                                ▼                        │
                 ┌────────────────────────────┐         │
                 │  FastAPI (backend/)         │─────────┘
                 │  • verify JWT (JWKS)        │
                 │  • analytics endpoints      │
                 │  • research retrieval       │   ┌──────────────┐
                 │  • AI gateway  ─────────────┼──▶│ OpenRouter   │
                 └────────────────────────────┘   │ (free-first) │
                                                   └──────────────┘
```

**Why this split.** Prisma is TS‑only and excellent for app CRUD + migrations.
The intelligence work (embeddings, retrieval, numerical models, LLM
orchestration) is far better served by Python. Keeping FastAPI stateless and
read‑mostly means it scales independently and never owns schema.

## 2. Data ownership

- **Prisma owns the schema and all migrations** (`frontend/prisma`). It is the
  single source of truth. The Python side never runs DDL.
- FastAPI reads via `asyncpg`/SQLAlchemy Core using the same Supabase Postgres
  connection. Generated SQL only; no second migration system.
- `shared/` holds the contract types (TS interfaces + pydantic models kept in
  sync) for payloads that cross the Next ↔ FastAPI boundary.

## 3. Auth & security

- **Supabase Auth** issues a JWT. Next.js stores the session (httpOnly cookie
  via `@supabase/ssr`); the browser never sees the service key.
- The frontend calls FastAPI with the user's Supabase access token. FastAPI
  verifies it against Supabase's JWKS and extracts `sub` (the user id).
- **Row-Level Security is enabled on every table** with policies keyed on
  `auth.uid()` so the `anon`/`authenticated` roles can only touch their own
  rows. Privileged server work (Prisma in Next route handlers, FastAPI) uses a
  service role / direct connection as appropriate.
- Secrets (`OPENROUTER_API_KEY`, service keys) live only in server env, never in
  the client bundle.

## 4. AI gateway (backend/app/ai)

OpenRouter‑compatible client with a **model fallback chain**:

1. Try configured **free** models in order (e.g. free Llama/Qwen/DeepSeek tiers).
2. Fall back to the next model on rate‑limit/error.
3. If no API key is configured, use a **deterministic rule‑based responder** so
   the product still works end‑to‑end (the same pattern proven in the strength
   coach).

Every AI response is normalized to `{ content, model, confidence, citations[],
reasoning }`. The gateway is the only place that talks to an LLM.

## 5. Research & citation engine (research/, backend/app/research)

- Curated, human‑written **research summaries** live as markdown with
  structured front‑matter (`title`, `authors`, `year`, `doi`, `tags`,
  `claims[]`).
- An ingestion script chunks + embeds them into a `ResearchChunk` table
  (pgvector). 
- At inference time the coach does **retrieval‑augmented generation**: it
  retrieves the top‑k relevant chunks and the LLM may cite *only* those. A
  citation that doesn't map to a retrieved chunk is rejected. This is how we
  guarantee "never hallucinate citations."

## 6. Analytics engine (analytics/)

Pure functions, no I/O, fully unit‑tested. Used by FastAPI (and mirrored in TS
where the frontend needs instant client‑side math):

- 1RM: **Epley** and **Brzycki**; consensus estimate.
- Volume (weight × reps × sets), tonnage, set‑volume.
- **RIR/RPE** ↔ intensity mapping.
- Rolling averages / EWMA for trend (strength, bodyweight).
- **Plateau detection** (slope of best‑1RM over a window vs. noise).
- Progression rate and projected‑PR date.
- Fatigue proxy (acute:chronic volume ratio).

## 7. Frontend structure

```
frontend/src/
├── app/
│   ├── (marketing)/         landing, auth
│   ├── (app)/               authed shell: dashboard, strength, nutrition,
│   │                        body, recovery, coach, reports, settings
│   └── api/                 Next route handlers (Prisma CRUD)
├── components/
│   ├── ui/                  design-system primitives (Card, Stat, Ring, …)
│   ├── charts/              Recharts wrappers
│   └── <feature>/           feature components
├── lib/                     prisma, supabase, fetchers, analytics (TS mirror)
└── styles/                  tokens, globals
```

Feature‑folder organization; design‑system primitives are shared; charts are
isolated so they can be swapped without touching pages.

## 8. Conventions

- TypeScript strict; Python typed + `ruff`/`mypy`.
- Tests: Vitest (frontend units), pytest (analytics + backend).
- Migrations are forward‑only and reviewed.
- Every feature ships with: schema → API → UI → at least one test.
