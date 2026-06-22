# Deploying STRATUM to Vercel

The Next.js app in `frontend/` is fully self-contained (it talks to Supabase
directly and calls OpenRouter server-side), so it deploys to Vercel as a single
project. The FastAPI service in `backend/` is optional and not required for the
app to run.

## 1. Import the project
1. Go to <https://vercel.com/new> and import the GitHub repo (`rakib-akter/irontrack`).
2. **Root Directory:** set to `frontend`.
3. Framework preset: **Next.js** (auto-detected). Build command and install are
   handled by the package scripts (`build` runs `prisma generate && next build`).

## 2. Environment variables
Add these in **Project → Settings → Environment Variables** (Production +
Preview):

| Name | Value |
|---|---|
| `DATABASE_URL` | Supabase pooled URL (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct URL (port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon/public key |
| `OPENROUTER_API_KEY` | free OpenRouter key (optional — AI features degrade gracefully without it) |

(`OPENROUTER_MODELS` / `OPENROUTER_FALLBACK_MODELS` are optional overrides.)

## 3. Supabase Auth configuration
In Supabase → **Authentication → URL Configuration**:
- **Site URL:** your Vercel production URL (e.g. `https://stratum.vercel.app`).
- **Redirect URLs:** add `https://<your-app>.vercel.app/**` (and keep
  `http://localhost:3000/**` for local dev). This lets the email-confirmation
  link in `/auth/callback` redirect back to the deployed app.

## 4. Deploy
Click **Deploy**. Vercel builds and hosts it; every push to `main` auto-deploys.

## Notes
- Migrations are **not** run on Vercel — apply schema changes locally with
  `npx prisma migrate deploy` against the same database before/after deploying.
- The progress-photos Storage bucket + RLS already exist in the Supabase project.
- The AI narrative route allows up to 30s (`maxDuration`) for slow free models.
