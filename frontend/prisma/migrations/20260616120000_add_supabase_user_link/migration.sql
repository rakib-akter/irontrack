-- Link app users to Supabase Auth and relax the legacy password hash.
-- supabaseUserId is NULL for everyone until they next sign in, so the unique
-- index is safe to add.

ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "supabaseUserId" TEXT;
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");
