# IronTrack — Gym Progress Tracker + AI Coach

Track your lifts, watch your estimated 1-rep max climb on a graph, set strength
goals (e.g. a 315 lb bench), and get AI-style coaching with a concrete plan for
your next session.

This repo is a monorepo so a mobile app can be added later:

```
Health app/
└── web/      → Next.js full-stack web app (UI + API)
```

## Features

- **Auth** — email/password sign up & log in (sessions in a signed httpOnly cookie).
- **Log lifts** — exercise, weight, reps, sets, unit (lb/kg), date, notes.
- **Progress graphs** — estimated 1-rep max (Epley formula) over time per lift,
  with your goal drawn as a reference line.
- **Goals** — set a target weight (and rep count) per lift; see % progress.
- **AI Coach** — analyzes your history vs. your goal and returns feedback plus a
  prescribed next-session plan (warm-up + working sets + rationale) to close the
  gap. Today this is a deterministic, rule-based engine (no API key needed); it
  lives behind a `Coach` interface so a real LLM (Claude/OpenAI) can be dropped
  in by editing a single file — see `web/src/lib/coach/index.ts`.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Prisma ORM → Postgres (Supabase)
- Recharts for graphs
- jose (JWT sessions) + bcryptjs (password hashing) + zod (validation)

## Setup

1. **Install dependencies**

   ```bash
   cd web
   npm install
   ```

2. **Create a database.** Make a free project at https://supabase.com, then go
   to **Settings → Database → Connection string** and copy both the *pooled*
   (port 6543) and *direct* (port 5432) connection strings.

3. **Configure env.** Copy `web/.env.example` to `web/.env` and fill in
   `DATABASE_URL` (pooled) and `DIRECT_URL` (direct). A `SESSION_SECRET` is
   already generated in `.env`.

   > No Supabase yet? You can point both URLs at any local Postgres, e.g.
   > `postgresql://postgres:postgres@localhost:5432/irontrack`.

4. **Create the database tables**

   ```bash
   cd web
   npx prisma migrate dev --name init
   ```

5. **Run it**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000, create an account, and log your first lift.

## How the AI coach works

`web/src/lib/coach/` defines a `Coach` interface and a `MockCoach`
implementation. Given a lift's history and goal it computes:

- best & current estimated 1RM,
- progress % toward the goal,
- a trend (improving / plateau / declining) via a linear fit on 1RM over time,
- a projection of when you'll hit the goal at your current rate,
- a next-session prescription whose intensity scales with how close you are.

To use a real model, implement a new class (e.g. `ClaudeCoach`) that fulfils the
same interface and return it from `getCoach()`. Nothing else in the app changes.
