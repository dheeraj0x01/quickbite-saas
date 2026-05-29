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
