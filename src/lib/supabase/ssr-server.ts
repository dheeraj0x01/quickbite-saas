import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side Supabase client that reads/writes auth cookies via
 * Next.js' `cookies()` API. Used in:
 *   - Server Components
 *   - Route Handlers
 *   - Server Actions
 *
 * Always returns a *user-scoped* client — no service-role privileges. RLS
 * applies. For elevated operations keep using `supabaseAdmin` (server.ts).
 */
export async function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
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
          // Called from a Server Component — Next.js disallows mutating cookies
          // there. The middleware refreshes sessions, so this is safe to ignore.
        }
      },
    },
  });
}
