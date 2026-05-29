import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { MenuItemRow } from "@/lib/types/database";
import { MenuItemInput } from "@/lib/types/admin";

/**
 * CRUD helpers for `menu_items`. All take a `restaurantId` so cross-tenant
 * accidents are impossible.
 */

export async function listMenuItemsAdmin(
  restaurantId: string,
): Promise<MenuItemRow[]> {
  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[admin/menu] list error:", error.message);
    return [];
  }
  return (data ?? []) as MenuItemRow[];
}

export async function createMenuItem(
  restaurantId: string,
  input: MenuItemInput,
): Promise<MenuItemRow | null> {
  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .insert({
      restaurant_id: restaurantId,
      name: input.name,
      description: input.description ?? null,
      category: input.category,
      price: input.price,
      veg: input.veg,
      emoji: input.emoji ?? null,
      image_url: input.image_url ?? null,
      tags: input.tags ?? [],
      in_stock: input.in_stock,
      display_order: input.display_order ?? 0,
    })
    .select("*")
    .single();
  if (error) {
    console.error("[admin/menu] create error:", error.message);
    return null;
  }
  return data as MenuItemRow;
}

export async function updateMenuItem(
  restaurantId: string,
  id: string,
  input: Partial<MenuItemInput>,
): Promise<MenuItemRow | null> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.category !== undefined) patch.category = input.category;
  if (input.price !== undefined) patch.price = input.price;
  if (input.veg !== undefined) patch.veg = input.veg;
  if (input.emoji !== undefined) patch.emoji = input.emoji;
  if (input.image_url !== undefined) patch.image_url = input.image_url;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.in_stock !== undefined) patch.in_stock = input.in_stock;
  if (input.display_order !== undefined)
    patch.display_order = input.display_order;

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .update(patch)
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select("*")
    .single();
  if (error) {
    console.error("[admin/menu] update error:", error.message);
    return null;
  }
  return data as MenuItemRow;
}

export async function deleteMenuItem(
  restaurantId: string,
  id: string,
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("menu_items")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);
  if (error) {
    console.error("[admin/menu] delete error:", error.message);
    return false;
  }
  return true;
}
