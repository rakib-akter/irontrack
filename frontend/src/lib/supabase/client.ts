"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for use in browser/client components. Reads the public
 * URL + anon key (safe to ship to the browser; protected by RLS). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
