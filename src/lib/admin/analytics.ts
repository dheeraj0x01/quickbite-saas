import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { DashboardStats } from "@/lib/types/admin";

/**
 * Compute today's KPIs and a recent-orders feed for the admin dashboard.
 *
 * "Today" = local date based on the server timezone, anchored to UTC start
 * of day. Sufficient for the demo; production would scope to a restaurant
 * timezone column.
 */
export async function getDashboardStats(
  restaurantId: string,
): Promise<DashboardStats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startIso = startOfDay.toISOString();

  // 1) All today's orders.
  const { data: today, error: todayErr } = await supabaseAdmin
    .from("orders")
    .select("id, status, total, payment_method, payment_status, created_at")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", startIso);

  if (todayErr) console.error("[analytics] today error:", todayErr.message);

  const todayRows = today ?? [];
  const ordersToday = todayRows.length;

  let revenueToday = 0;
  let onlineRevenue = 0;
  let cashRevenue = 0;
  let paidOrders = 0;
  let unpaidOrders = 0;
  let activeOrders = 0;
  let completedToday = 0;
  let pendingOrders = 0;

  for (const o of todayRows) {
    const status = (o.status as string) ?? "pending";
    const total = Number(o.total ?? 0);
    const method = ((o.payment_method as string) ?? "cash").toLowerCase();
    const payStatus = ((o.payment_status as string) ?? "unpaid").toLowerCase();

    if (payStatus === "paid") paidOrders += 1;
    else if (payStatus === "unpaid") unpaidOrders += 1;

    if (status === "completed") {
      completedToday += 1;
      revenueToday += total;
      if (method === "online") onlineRevenue += total;
      else cashRevenue += total;
    } else if (status === "cancelled") {
      // exclude from revenue
    } else {
      activeOrders += 1;
      if (status === "pending") pendingOrders += 1;
      // For online orders, also count revenue immediately because the
      // money has already cleared even if the food hasn't been served.
      if (method === "online" && payStatus === "paid") {
        revenueToday += total;
        onlineRevenue += total;
      }
    }
  }

  // 2) Recent orders (last 8) with item counts + payment fields.
  const { data: recent } = await supabaseAdmin
    .from("orders")
    .select(
      "id, status, total, payment_method, payment_status, created_at, restaurant_tables(table_number), order_items(id)",
    )
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(8);

  const recentOrders =
    (recent ?? []).map((o) => {
      const tbl = o.restaurant_tables as
        | { table_number?: number }
        | { table_number?: number }[]
        | null;
      const table_number = Array.isArray(tbl)
        ? (tbl[0]?.table_number ?? null)
        : (tbl?.table_number ?? null);
      const items = (o.order_items as { id: string }[] | null) ?? [];
      const id = o.id as string;
      return {
        id,
        short_id: id.replace(/-/g, "").slice(-6).toUpperCase(),
        table_number,
        status: o.status as string,
        total: Number(o.total ?? 0),
        payment_method: (o.payment_method as string) ?? null,
        payment_status: (o.payment_status as string) ?? null,
        created_at: o.created_at as string,
        item_count: items.length,
      };
    }) ?? [];

  // 3) Top items today.
  const todayIds = todayRows.map((o) => o.id);
  let topItems: DashboardStats["topItems"] = [];
  if (todayIds.length > 0) {
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("quantity, price, menu_items(name), order_id")
      .in("order_id", todayIds);

    const map = new Map<string, { quantity: number; revenue: number }>();
    (items ?? []).forEach((row) => {
      const menu = row.menu_items as
        | { name?: string }
        | { name?: string }[]
        | null;
      const name = Array.isArray(menu)
        ? (menu[0]?.name ?? "Unknown")
        : (menu?.name ?? "Unknown");
      const q = Number(row.quantity ?? 0);
      const p = Number(row.price ?? 0);
      const existing = map.get(name) ?? { quantity: 0, revenue: 0 };
      existing.quantity += q;
      existing.revenue += q * p;
      map.set(name, existing);
    });
    topItems = Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }

  // 4) Feedback summary (lifetime, not just today).
  let averageRating = 0;
  let totalReviews = 0;
  const { data: feedbackRows } = await supabaseAdmin
    .from("feedback")
    .select("overall_rating")
    .eq("restaurant_id", restaurantId);
  if (feedbackRows && feedbackRows.length > 0) {
    totalReviews = feedbackRows.length;
    const sum = feedbackRows.reduce(
      (s, r) => s + Number(r.overall_rating ?? 0),
      0,
    );
    averageRating = Math.round((sum / totalReviews) * 10) / 10;
  }

  return {
    ordersToday,
    activeOrders,
    completedToday,
    pendingOrders,
    revenueToday,
    onlineRevenue,
    cashRevenue,
    paidOrders,
    unpaidOrders,
    averageRating,
    totalReviews,
    topItems,
    recentOrders,
  };
}
