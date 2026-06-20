# STRATUM — Roadmap

Built in phases. Every phase keeps the app functional and ships verified,
focused commits. ✅ done · 🔄 in progress · ⬜ planned.

## Phase 0 — Foundation ✅
- ✅ Monorepo restructure (`frontend/`, `backend/`, `analytics/`, `research/`, `shared/`, `docs/`)
- ✅ Architecture + roadmap + data-model docs
- ✅ `analytics/` engine: Epley, Brzycki, RIR, rolling averages, plateau detection (28 pytest tests)
- ✅ Expanded Prisma schema for all six domains + migration (RLS on every table)

## Phase 0b — Intelligence service ✅
- ✅ FastAPI skeleton that boots (`/health`, OpenAPI docs at `/docs`)
- ✅ Supabase JWT verification dependency (ready to wire in 0c)
- ✅ AI gateway: OpenRouter free-first + fallback + no-key rule-based mode
- ✅ Analytics endpoints exposing the `analytics/` package

## Phase 0c — Design system + auth
- ✅ STRATUM design system: off-white/graphite, electric-blue accent, rounded
  cards, glass utility, self-hosted Inter (Fontsource) — semantic CSS-var tokens
- ✅ Framer Motion entrance animations (FadeIn/Stagger) + reduced-motion respect
- ✅ Dark mode (no-flash, class-based toggle in nav)
- 🔄 UI primitives: extract Stat/Ring/Heatmap/Sparkline/PageHeader (ongoing as pillars land)
- ✅ Migrate to Supabase Auth (middleware session refresh, User linking, callback).
  Note: data authz stays in the app layer via Prisma, so RLS remains deny-all on
  the Data API (more secure than per-user `auth.uid()` policies for this design).
- ⬜ Onboarding flow

## Phase 1 — Strength Intelligence Engine  *(first pillar)*
- ✅ Logging: weight, reps, sets, RPE, rest, tempo
- ✅ Auto-calc: 1RM, volume, progression rate, plateau, projected PR (analytics)
- ✅ Dashboard: strength score, strongest lifts, projected PR date, muscle-group progression
- ✅ Charts: moving average + projected future strength (bodyweight-adjusted: follow-up)
- ✅ AI insights: week-over-week volume, plateau, PR pace, muscle balance (rule-based; LLM-ready)

## Phase 2 — Nutrition Operating System ✅
- ✅ Macros + fiber + full micronutrient panel (curated food DB, per-100g)
- ✅ Logging: manual, quick-add from food DB, AI meal parsing (barcode: follow-up)
- ✅ Calorie ring, macro rings, micronutrient heatmap, nutrition quality score
- ✅ AI: low-nutrient explanations + practical food suggestions + confidence
- ✅ Follow-ups: meal templates (save/apply a day's log) + barcode scanning (Open Food Facts)
- ⬜ Remaining: more foods / USDA integration

## Phase 3 — AI Strength Coach + Research engine  *(the moat)* ✅
- ✅ Research corpus (14 sources / 42 claims) → retrieval (lexical; pgvector-via-FastAPI is the upgrade seam)
- ✅ Citation engine (retrieval-only — the coach can only cite retrieved claims)
- ✅ Weekly plan generation (per-lift sets/reps/intensity/rest/progression)
- ✅ Confidence + reasoning + evidence (citations) on every recommendation
- ✅ Coach memory (strengths, weak points, compliance) on CoachProfile

## Phase 4 — Body Composition
- ⬜ Track weight, waist, neck, progress photos
- ⬜ Estimate lean/fat mass, trend weight
- ⬜ Timeline (month/quarter/year) + "most loss was fat" insight

## Phase 5 — Recovery + Readiness
- ⬜ Track sleep, stress, steps, energy, DOMS
- ⬜ Recovery score + training readiness + deload/volume warnings

## Phase 6 — Intelligence Layer
- ⬜ Daily / weekly / monthly reports: wins, misses, predictions, next actions

## Phase 7 — Premium polish
- ⬜ Streaks, export reports, period comparisons, optimistic updates,
  micro-animations, performance pass
