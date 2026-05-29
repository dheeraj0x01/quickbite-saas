import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CategoryRow } from "@/lib/types/admin";

/** CRUD + reordering helpers for `categories`. */

export async function listCategories(
  restaurantId: string,
): Promise<CategoryRow[]> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[admin/categories] list error:", error.message);
    return [];
  }
  return (data ?? []) as CategoryRow[];
}

export async function createCategory(
  restaurantId: string,
  input: { slug: string; label: string; emoji?: string },
): Promise<CategoryRow | null> {
  // Append at the end by default.
  const { data: maxRow } = await supabaseAdmin
    .from("categories")
    .select("display_order")
    .eq("restaurant_id", restaurantId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.display_order ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert({
      restaurant_id: restaurantId,
      slug: input.slug,
      label: input.label,
      emoji: input.emoji ?? null,
      display_order: nextOrder,
      visible: true,
    })
    .select("*")
    .single();
  if (error) {
    console.error("[admin/categories] create error:", error.message);
    return null;
  }
  return data as CategoryRow;
}

export async function updateCategory(
  restaurantId: string,
  id: string,
  input: Partial<{
    label: string;
    emoji: string | null;
    visible: boolean;
    display_order: number;
  }>,
): Promise<CategoryRow | null> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .update(input)
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select("*")
    .single();
  if (error) {
    console.error("[admin/categories] update error:", error.message);
    return null;
  }
  return data as CategoryRow;
}

export async function deleteCategory(
  restaurantId: string,
  id: string,
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);
  if (error) {
    console.error("[admin/categories] delete error:", error.message);
    return false;
  }
  return true;
}

export async function reorderCategories(
  restaurantId: string,
  ordered: { id: string; display_order: number }[],
): Promise<boolean> {
  for (const row of ordered) {
    const { error } = await supabaseAdmin
      .from("categories")
      .update({ display_order: row.display_order })
      .eq("id", row.id)
      .eq("restaurant_id", restaurantId);
    if (error) {
      console.error("[admin/categories] reorder error:", error.message);
      return false;
    }
  }
  return true;
}
