import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  KitchenOrder,
  KitchenOrderItem,
  OrderStatus,
} from "@/lib/types/kitchen";

/**
 * Fetch the latest orders + their line items + table number for a
 * given restaurant. Done in two queries (orders, then items) and
 * stitched together in JS — keeps it portable across Supabase versions
 * that may not expose the embedded-relation join shape consistently.
 */
export async function getKitchenOrders(
  restaurantId: string,
  limit = 50,
): Promise<KitchenOrder[]> {
  // 1) Orders + the related table_number via FK.
  const { data: orders, error: oErr } = await supabaseAdmin
    .from("orders")
    .select(
      "id, restaurant_id, table_id, status, subtotal, gst, total, payment_method, payment_status, created_at, restaurant_tables(table_number)",
    )
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (oErr || !orders) {
    console.error("[getKitchenOrders] orders error:", oErr?.message);
    return [];
  }

  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);

  // 2) Items + the related menu_item.name via FK.
  const { data: items, error: iErr } = await supabaseAdmin
    .from("order_items")
    .select(
      "id, order_id, menu_item_id, quantity, price, menu_items(name)",
    )
    .in("order_id", orderIds);

  if (iErr) {
    console.error("[getKitchenOrders] items error:", iErr.message);
  }

  // Group items by order_id for quick lookup.
  const itemsByOrder = new Map<string, KitchenOrderItem[]>();
  (items ?? []).forEach((row) => {
    if (!row.order_id) return;
    const orderId = row.order_id as string;
    const list = itemsByOrder.get(orderId) ?? [];
    const menu = row.menu_items as { name?: string } | { name?: string }[] | null;
    const name = Array.isArray(menu) ? (menu[0]?.name ?? "Unknown") : (menu?.name ?? "Unknown");
    list.push({
      id: row.id as string,
      menu_item_id: (row.menu_item_id as string) ?? null,
      name,
      quantity: Number(row.quantity),
      price: Number(row.price),
    });
    itemsByOrder.set(orderId, list);
  });

  return orders.map((o) => {
    const tbl = o.restaurant_tables as
      | { table_number?: number }
      | { table_number?: number }[]
      | null;
    const table_number = Array.isArray(tbl)
      ? (tbl[0]?.table_number ?? null)
      : (tbl?.table_number ?? null);

    return {
      id: o.id as string,
      restaurant_id: o.restaurant_id as string,
      table_id: (o.table_id as string) ?? null,
      table_number,
      status: (o.status as OrderStatus) ?? "pending",
      subtotal: Number(o.subtotal ?? 0),
      gst: Number(o.gst ?? 0),
      total: Number(o.total ?? 0),
      payment_method: (o.payment_method as string | null) ?? null,
      payment_status: (o.payment_status as string | null) ?? null,
      created_at: o.created_at as string,
      items: itemsByOrder.get(o.id as string) ?? [],
    };
  });
}
