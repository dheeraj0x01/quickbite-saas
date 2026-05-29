import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  RestaurantRow,
  RestaurantTableRow,
} from "@/lib/types/database";

/**
 * Restaurant + table fetch helpers.
 * All functions are server-only and return null when no row matches.
 */

export async function getRestaurantBySlug(
  slug: string,
): Promise<RestaurantRow | null> {
  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    // ──────────────────────────────────────────────────────────────
    // TEMPORARY DEBUG LOGGING — remove after the production issue
    // is diagnosed. Logs the full Supabase error shape plus a clean
    // view of the env vars (length only — never the actual values).
    // ──────────────────────────────────────────────────────────────
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isClean = (v: string | undefined) =>
      typeof v === "string" && /^[\x20-\x7e]*$/.test(v);
    console.error("[getRestaurantBySlug] DEBUG", {
      slug,
      supabase_error: {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
      env: {
        NEXT_PUBLIC_SUPABASE_URL_exists: typeof url === "string" && url.length > 0,
        NEXT_PUBLIC_SUPABASE_URL_length: url?.length ?? 0,
        NEXT_PUBLIC_SUPABASE_URL_clean: isClean(url),
        SUPABASE_SERVICE_ROLE_KEY_exists:
          typeof key === "string" && key.length > 0,
        SUPABASE_SERVICE_ROLE_KEY_length: key?.length ?? 0,
        SUPABASE_SERVICE_ROLE_KEY_clean: isClean(key),
      },
    });

    console.error("[getRestaurantBySlug] error:", error.message);
    return null;
  }
  return (data as RestaurantRow | null) ?? null;
}

export async function getTableByNumber(
  restaurantId: string,
  tableNumber: number,
): Promise<RestaurantTableRow | null> {
  const { data, error } = await supabaseAdmin
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("table_number", tableNumber)
    .maybeSingle();

  if (error) {
    console.error("[getTableByNumber] error:", error.message);
    return null;
  }
  return (data as RestaurantTableRow | null) ?? null;
}

export async function getTablesByRestaurant(
  restaurantId: string,
): Promise<RestaurantTableRow[]> {
  const { data, error } = await supabaseAdmin
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("table_number", { ascending: true });

  if (error) {
    console.error("[getTablesByRestaurant] error:", error.message);
    return [];
  }
  return (data ?? []) as RestaurantTableRow[];
}
