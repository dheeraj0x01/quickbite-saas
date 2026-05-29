import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client.
 *
 * Use this in:
 *   - Client Components ("use client")
 *   - Anything that runs in the user's browser
 *
 * Security:
 *   - Uses only the public anon key — safe to ship to the browser.
 *   - All access is governed by your Row Level Security (RLS) policies.
 *   - NEVER import the service-role key here.
 *
 * Initialization is lazy so that `next build` can introspect modules that
 * import this file without requiring env vars at build time.
 */

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart `npm run dev`.",
    );
  }

  _client = createClient(supabaseUrl, supabaseAnonKey);
  return _client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
