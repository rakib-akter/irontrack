import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// Authentication is owned by Supabase Auth. Our `User` table holds app data and
// is linked to the Supabase user via `supabaseUserId` (set on first sign-in).
// Data access stays in the app layer through Prisma (scoped by our User.id), so
// we never expose tables through the Supabase Data API.

/**
 * Returns the app User.id for the signed-in Supabase user, creating/linking the
 * row on first sign-in. Returns null when not authenticated.
 */
export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  // Fast path: already linked.
  const linked = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true },
  });
  if (linked) return linked.id;

  // First sign-in: link an existing email row or create a new User.
  const name =
    (user.user_metadata?.name as string | undefined) ?? null;
  const created = await prisma.user.upsert({
    where: { email: user.email.toLowerCase() },
    update: { supabaseUserId: user.id },
    create: {
      email: user.email.toLowerCase(),
      supabaseUserId: user.id,
      name,
    },
    select: { id: true },
  });
  return created.id;
}
