import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { MenuItemRow } from "@/lib/types/database";

/**
 * Menu item fetch helpers (server-only).
 *
 * Returned shape matches the Supabase `menu_items` row, with `tags` typed
 * as the simple `string[]` Postgres returns.
 */

export async function getMenuItemsByRestaurant(
  restaurantId: string,
): Promise<MenuItemRow[]> {
  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[getMenuItemsByRestaurant] error:", error.message);
    return [];
  }
  return (data ?? []) as MenuItemRow[];
}

/**
 * Build the unique category list for a restaurant from its menu items.
 * Always prepends an "all" category like the original UI expected.
 */
export function deriveCategories(items: MenuItemRow[]) {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const item of items) {
    if (!seen.has(item.category)) {
      seen.add(item.category);
      ordered.push(item.category);
    }
  }

  const labelOf = (cat: string) =>
    cat.charAt(0).toUpperCase() + cat.slice(1);
  const emojiFor = (cat: string) => {
    switch (cat) {
      case "biryani": return "🍛";
      case "starters": return "🍗";
      case "breads": return "🫓";
      case "drinks": return "☕";
      case "desserts": return "🍮";
      default: return "🍽";
    }
  };

  return [
    { id: "all", label: "All Dishes", emoji: "🍽" },
    ...ordered.map((cat) => ({
      id: cat,
      label: labelOf(cat),
      emoji: emojiFor(cat),
    })),
  ];
}
