import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { RestaurantTableRow } from "@/lib/types/database";

/** CRUD helpers for `restaurant_tables`. */

export async function listTables(
  restaurantId: string,
): Promise<RestaurantTableRow[]> {
  const { data, error } = await supabaseAdmin
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("table_number", { ascending: true });
  if (error) {
    console.error("[admin/tables] list error:", error.message);
    return [];
  }
  return (data ?? []) as RestaurantTableRow[];
}

export async function addTable(
  restaurantId: string,
  tableNumber: number,
): Promise<RestaurantTableRow | null> {
  const { data, error } = await supabaseAdmin
    .from("restaurant_tables")
    .insert({ restaurant_id: restaurantId, table_number: tableNumber })
    .select("*")
    .single();
  if (error) {
    console.error("[admin/tables] add error:", error.message);
    return null;
  }
  return data as RestaurantTableRow;
}

export async function deleteTable(
  restaurantId: string,
  id: string,
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("restaurant_tables")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);
  if (error) {
    console.error("[admin/tables] delete error:", error.message);
    return false;
  }
  return true;
}

export async function nextTableNumber(restaurantId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("restaurant_tables")
    .select("table_number")
    .eq("restaurant_id", restaurantId)
    .order("table_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.table_number ?? 0) + 1;
}
