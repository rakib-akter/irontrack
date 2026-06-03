-- Enable Row-Level Security (RLS) on every table in the public schema.
--
-- Supabase exposes public-schema tables through its auto-generated REST API
-- (PostgREST), reachable with the publishable anon key. With RLS off, those
-- roles can read/write the tables directly. Enabling RLS with NO policies
-- denies all access to the `anon` and `authenticated` roles, closing that API.
--
-- This does NOT affect the app: IronTrack connects via Prisma as the `postgres`
-- table-owner role, which bypasses RLS (we do not FORCE it), so all app queries
-- continue to work. We don't use Supabase Auth or the Data API at all.

ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."LiftEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."BodyWeightEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."BodyWeightGoal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."VolumeGoal" ENABLE ROW LEVEL SECURITY;
