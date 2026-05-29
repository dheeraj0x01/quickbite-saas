"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client used for *auth interactions* (sign-in, sign-out,
 * session subscription). Cookies are managed automatically by @supabase/ssr.
 *
 * Note: We keep the existing `src/lib/supabase/client.ts` for non-auth
 * data calls. This separate factory is used wherever we need the SSR
 * cookie-aware client on the browser side.
 */
export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }
  return createBrowserClient(url, anonKey);
}
