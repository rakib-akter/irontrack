# STRATUM backend — Intelligence Service

FastAPI service for AI, analytics, and (later) research retrieval. Stateless;
reads the same Supabase Postgres as the Next.js app and never owns the schema.

## Run

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install --use-feature=truststore -r requirements.txt
.venv/Scripts/python -m pip install --use-feature=truststore -e ../analytics
cp .env.example .env            # optional
.venv/Scripts/uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for interactive API docs.

> On this machine, `--use-feature=truststore` makes pip trust the Windows
> certificate store (a local TLS proxy otherwise breaks pip).

## Endpoints (Phase 0b)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | – | liveness + AI mode |
| POST | `/analytics/one-rep-max` | – | Epley/Brzycki/consensus 1RM (+ from RPE) |
| POST | `/analytics/progression` | – | progression rate, plateau, weeks-to-target |
| GET | `/ai/status` | – | model vs rule-based mode |
| POST | `/ai/complete` | – | LLM completion via OpenRouter (free-first) or rule-based |

## Design

- `app/config.py` — env settings.
- `app/security.py` — Supabase JWT verification dependency (wired in Phase 0c).
- `app/ai/gateway.py` — OpenRouter client, free-first fallback chain, rule-based
  mode when no key is set. The only place that calls an LLM.
- `app/routers/analytics.py` — thin HTTP layer over the `stratum_analytics`
  package (pure, tested models).
