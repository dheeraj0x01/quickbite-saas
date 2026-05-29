import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { FeedbackRow, FeedbackStats } from "@/lib/types/feedback";

/**
 * Compute aggregate feedback statistics for a restaurant.
 *
 *   - totalReviews
 *   - averageOverall / averageFood / averageService (rounded to 1 dp)
 *   - distribution by star count (1..5) with both raw count and percent
 *   - latest 30 reviews for the comments list
 */
export async function getFeedbackStats(
  restaurantId: string,
): Promise<FeedbackStats> {
  const { data, error } = await supabaseAdmin
    .from("feedback")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[feedback] stats error:", error.message);
    return emptyStats();
  }

  const rows = (data ?? []) as FeedbackRow[];
  if (rows.length === 0) return emptyStats();

  let sumOverall = 0;
  let sumFood = 0;
  let sumService = 0;
  const buckets = [0, 0, 0, 0, 0]; // index 0 = 1 star
  for (const r of rows) {
    sumOverall += r.overall_rating;
    sumFood += r.food_rating;
    sumService += r.service_rating;
    const idx = Math.min(5, Math.max(1, r.overall_rating)) - 1;
    buckets[idx] += 1;
  }

  const total = rows.length;
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = buckets[stars - 1];
    return {
      stars,
      count,
      percent: Math.round((count / total) * 100),
    };
  });

  return {
    totalReviews: total,
    averageOverall: round1(sumOverall / total),
    averageFood: round1(sumFood / total),
    averageService: round1(sumService / total),
    distribution,
    recent: rows.slice(0, 30),
  };
}

/**
 * Top / lowest rated menu items, derived from feedback joined to orders +
 * order_items. Items must have at least 1 feedback entry to appear.
 */
export async function getRatedItems(
  restaurantId: string,
): Promise<{
  topItems: { name: string; avg: number; count: number }[];
  lowestItems: { name: string; avg: number; count: number }[];
}> {
  // We compute item-level ratings by attributing each feedback's
  // overall_rating to every menu item that was in the related order.
  const { data: feedback } = await supabaseAdmin
    .from("feedback")
    .select("order_id, food_rating")
    .eq("restaurant_id", restaurantId)
    .not("order_id", "is", null);

  if (!feedback || feedback.length === 0) return { topItems: [], lowestItems: [] };

  const orderIds = feedback.map((f) => f.order_id as string);
  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("order_id, menu_items(name)")
    .in("order_id", orderIds);

  const ratingByOrder = new Map<string, number>();
  for (const f of feedback) ratingByOrder.set(f.order_id as string, Number(f.food_rating));

  const accum = new Map<string, { sum: number; count: number }>();
  (items ?? []).forEach((row) => {
    const orderId = row.order_id as string;
    const r = ratingByOrder.get(orderId);
    if (r == null) return;
    const menu = row.menu_items as { name?: string } | { name?: string }[] | null;
    const name = Array.isArray(menu)
      ? (menu[0]?.name ?? "Unknown")
      : (menu?.name ?? "Unknown");
    const cur = accum.get(name) ?? { sum: 0, count: 0 };
    cur.sum += r;
    cur.count += 1;
    accum.set(name, cur);
  });

  const all = Array.from(accum.entries()).map(([name, v]) => ({
    name,
    avg: round1(v.sum / Math.max(1, v.count)),
    count: v.count,
  }));

  const sortedDesc = [...all].sort((a, b) => b.avg - a.avg).slice(0, 5);
  const sortedAsc = [...all].sort((a, b) => a.avg - b.avg).slice(0, 5);

  return { topItems: sortedDesc, lowestItems: sortedAsc };
}

function emptyStats(): FeedbackStats {
  return {
    totalReviews: 0,
    averageOverall: 0,
    averageFood: 0,
    averageService: 0,
    distribution: [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: 0,
      percent: 0,
    })),
    recent: [],
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
