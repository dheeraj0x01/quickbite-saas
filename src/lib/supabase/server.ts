import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client (privileged).
 *
 * Use this in:
 *   - Server Components
 *   - Route Handlers (`app/api/.../route.ts`)
 *   - Server Actions
 *   - Admin / kitchen dashboard code
 *
 * Security:
 *   - Uses the service-role key, which BYPASSES Row Level Security.
 *   - The `server-only` import above causes a build-time error if this file
 *     is ever imported into a Client Component, preventing accidental leaks.
 *   - Never import this from anything marked "use client".
 *
 * Initialization is lazy so that `next build` can introspect modules that
 * import this file without requiring env vars to be present at build time.
 */

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in .env.local, then restart `npm run dev`.",
    );
  }

  _client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _client;
}

/**
 * Proxy that defers client creation until the first method call.
 * Usage stays identical to a real SupabaseClient:
 *   supabaseAdmin.from("orders").select("*")
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
