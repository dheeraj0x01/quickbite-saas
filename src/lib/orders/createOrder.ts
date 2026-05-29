import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  CartItemPayload,
  CreateOrderPayload,
  CreateOrderResult,
  OrderItemSnapshot,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/types/order";

/**
 * Server-side order creation.
 *
 * Pipeline:
 *   1. Validate payload shape (slug, table number, non-empty cart).
 *   2. Resolve restaurant + table.
 *   3. Fetch authoritative menu_items (price + stock) — never trust
 *      anything from the client other than ids and quantities.
 *   4. Recompute subtotal, GST (5%), grand total on the server.
 *   5. For online payments: verify the expected_amount matches the server
 *      total to prevent post-checkout tampering.
 *   6. Insert order, then bulk-insert order_items. Roll back the order on
 *      a partial failure so we never leave orphans.
 *
 * Returns a discriminated union so callers can pattern-match cleanly.
 */
export async function createOrder(
  payload: CreateOrderPayload,
): Promise<CreateOrderResult> {
  // ---------- 1. Payload validation ----------
  const slug = (payload?.restaurant_slug ?? "").trim();
  const tableNumber = Number(payload?.table_number);
  const items: CartItemPayload[] = Array.isArray(payload?.items)
    ? payload.items
    : [];

  if (!slug)
    return { ok: false, code: "INVALID_PAYLOAD", error: "Missing restaurant slug." };
  if (!Number.isInteger(tableNumber) || tableNumber <= 0)
    return { ok: false, code: "INVALID_PAYLOAD", error: "Invalid table number." };
  if (items.length === 0)
    return { ok: false, code: "EMPTY_CART", error: "Cart is empty." };

  // De-duplicate + coerce quantity for safety.
  const cleanedItems = new Map<string, number>();
  for (const it of items) {
    if (!it?.menu_item_id || typeof it.menu_item_id !== "string")
      return { ok: false, code: "INVALID_PAYLOAD", error: "Invalid item id." };
    const q = Math.floor(Number(it.quantity));
    if (!Number.isFinite(q) || q <= 0)
      return { ok: false, code: "INVALID_PAYLOAD", error: "Invalid quantity." };
    cleanedItems.set(it.menu_item_id, (cleanedItems.get(it.menu_item_id) ?? 0) + q);
  }

  // Normalize payment method (legacy "upi" → "online").
  const paymentMethod: PaymentMethod =
    payload.payment_method === "online" || payload.payment_method === "upi"
      ? "online"
      : "cash";
  const isOnline = paymentMethod === "online";

  // ---------- 2. Restaurant ----------
  const { data: restaurant, error: rErr } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (rErr) {
    console.error("[createOrder] restaurant lookup error:", rErr.message);
    return { ok: false, code: "DB_INSERT_FAILED", error: "Database error." };
  }
  if (!restaurant)
    return { ok: false, code: "RESTAURANT_NOT_FOUND", error: "Restaurant not found." };

  // ---------- 3. Table ----------
  const { data: table, error: tErr } = await supabaseAdmin
    .from("restaurant_tables")
    .select("id, table_number")
    .eq("restaurant_id", restaurant.id)
    .eq("table_number", tableNumber)
    .maybeSingle();
  if (tErr) {
    console.error("[createOrder] table lookup error:", tErr.message);
    return { ok: false, code: "DB_INSERT_FAILED", error: "Database error." };
  }
  if (!table)
    return { ok: false, code: "TABLE_NOT_FOUND", error: "Table not found." };

  // ---------- 4. Menu items (authoritative price + stock) ----------
  const itemIds = Array.from(cleanedItems.keys());
  const { data: menuRows, error: mErr } = await supabaseAdmin
    .from("menu_items")
    .select("id, name, price, in_stock, restaurant_id")
    .in("id", itemIds);
  if (mErr) {
    console.error("[createOrder] menu lookup error:", mErr.message);
    return { ok: false, code: "DB_INSERT_FAILED", error: "Database error." };
  }
  const menuById = new Map((menuRows ?? []).map((m) => [m.id, m]));
  for (const id of itemIds) {
    const m = menuById.get(id);
    if (!m || m.restaurant_id !== restaurant.id) {
      return {
        ok: false,
        code: "MENU_ITEM_NOT_FOUND",
        error: `Menu item ${id} is not available at this restaurant.`,
      };
    }
    if (!m.in_stock) {
      return {
        ok: false,
        code: "OUT_OF_STOCK",
        error: `${m.name} is currently out of stock.`,
      };
    }
  }

  // ---------- 5. Authoritative totals ----------
  const snapshot: OrderItemSnapshot[] = itemIds.map((id) => {
    const m = menuById.get(id)!;
    const quantity = cleanedItems.get(id)!;
    const unit_price = Number(m.price);
    return {
      menu_item_id: id,
      name: m.name,
      quantity,
      unit_price,
      line_total: unit_price * quantity,
    };
  });

  const subtotal = snapshot.reduce((s, x) => s + x.line_total, 0);
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  // For online orders, ensure the amount Razorpay was charged matches.
  if (isOnline) {
    if (!payload.payment) {
      return {
        ok: false,
        code: "INVALID_PAYLOAD",
        error: "Online order missing verified payment context.",
      };
    }
    const expectedPaise = Number(payload.payment.expected_amount_paise);
    if (!Number.isFinite(expectedPaise) || expectedPaise !== total * 100) {
      return {
        ok: false,
        code: "AMOUNT_MISMATCH",
        error: "Order total does not match the paid amount.",
      };
    }
  }

  const paymentStatus: PaymentStatus = isOnline ? "paid" : "unpaid";

  // ---------- 6. Insert order + items ----------
  const insertPayload: Record<string, unknown> = {
    restaurant_id: restaurant.id,
    table_id: table.id,
    status: "pending",
    subtotal,
    gst,
    total,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
  };
  if (isOnline && payload.payment) {
    insertPayload.razorpay_order_id = payload.payment.razorpay_order_id;
    insertPayload.razorpay_payment_id = payload.payment.razorpay_payment_id;
    insertPayload.paid_at = new Date().toISOString();
  }

  const { data: order, error: oErr } = await supabaseAdmin
    .from("orders")
    .insert(insertPayload)
    .select("id, created_at")
    .single();

  if (oErr || !order) {
    console.error("[createOrder] order insert error:", oErr?.message);
    return { ok: false, code: "DB_INSERT_FAILED", error: "Failed to create order." };
  }

  const itemRows = snapshot.map((s) => ({
    order_id: order.id,
    menu_item_id: s.menu_item_id,
    quantity: s.quantity,
    price: s.unit_price,
  }));

  const { error: oiErr } = await supabaseAdmin
    .from("order_items")
    .insert(itemRows);

  if (oiErr) {
    console.error("[createOrder] order_items insert error:", oiErr.message);
    await supabaseAdmin.from("orders").delete().eq("id", order.id);
    return { ok: false, code: "DB_INSERT_FAILED", error: "Failed to save items." };
  }

  return {
    ok: true,
    order: {
      id: order.id,
      restaurant_id: restaurant.id,
      table_id: table.id,
      table_number: tableNumber,
      status: "pending",
      subtotal,
      gst,
      total,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      items: snapshot,
      created_at: order.created_at,
    },
  };
}
