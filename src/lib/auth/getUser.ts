import "server-only";
import { getServerSupabase } from "@/lib/supabase/ssr-server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Role } from "./permissions";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  full_name: string | null;
  restaurant_id: string | null;
};

/**
 * Resolve the current logged-in user + their profile (role).
 * Returns null when no valid session exists.
 *
 * Uses the cookie-aware SSR client to read the session, then loads the
 * profile via the service-role client (so RLS doesn't filter the row out
 * for cross-tenant restaurant lookups).
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, role, restaurant_id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    // Auth user exists but no profile yet (trigger should have created one).
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      role: "manager",
      full_name: null,
      restaurant_id: null,
    };
  }

  return {
    id: profile.id as string,
    email: (profile.email as string) ?? data.user.email ?? "",
    role: (profile.role as Role) ?? "manager",
    full_name: (profile.full_name as string | null) ?? null,
    restaurant_id: (profile.restaurant_id as string | null) ?? null,
  };
}
