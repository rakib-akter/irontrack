import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Supabase client for Server Components / route handlers. Bridges Supabase's
 * auth cookies to Next's cookie store so the session is read/refreshed on the
 * server. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll can be called from a Server Component where cookies are
            // read-only; middleware handles the refresh in that case.
          }
        },
      },
    },
  );
}
