import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getPublicRazorpayKey, getRazorpay } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/payments/create-order
 *
 *   Body:
 *     {
 *       "restaurant_slug": "spice-garden",
 *       "table_number": 4,
 *       "items": [{ "menu_item_id": "<uuid>", "quantity": 2 }]
 *     }
 *
 *   Response:
 *     {
 *       ok: true,
 *       razorpay_order_id, amount, currency, key_id,
 *       computed: { subtotal, gst, total }
 *     }
 *
 * Recomputes the cart total server-side using authoritative `menu_items.price`
 * and creates a corresponding Razorpay order. The actual restaurant order
 * row in `orders` is NOT created here — it's only created after signature
 * verification in /api/payments/verify, so the kitchen never sees an
 * unpaid online order.
 */
export async function POST(req: NextRequest) {
  let body: {
    restaurant_slug?: string;
    table_number?: number;
    items?: { menu_item_id: string; quantity: number }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const slug = (body.restaurant_slug ?? "").trim();
  const tableNumber = Number(body.table_number);
  const items = Array.isArray(body.items) ? body.items : [];

  if (!slug || !Number.isInteger(tableNumber) || tableNumber <= 0) {
    return NextResponse.json(
      { ok: false, error: "Missing slug or table_number" },
      { status: 400 },
    );
  }
  if (items.length === 0) {
    return NextResponse.json({ ok: false, error: "Cart is empty" }, { status: 400 });
  }

  // Cleanup + dedupe.
  const cleaned = new Map<string, number>();
  for (const it of items) {
    if (!it?.menu_item_id) {
      return NextResponse.json({ ok: false, error: "Invalid item id" }, { status: 400 });
    }
    const q = Math.floor(Number(it.quantity));
    if (!Number.isFinite(q) || q <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid quantity" }, { status: 400 });
    }
    cleaned.set(it.menu_item_id, (cleaned.get(it.menu_item_id) ?? 0) + q);
  }

  // Resolve restaurant.
  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (!restaurant) {
    return NextResponse.json({ ok: false, error: "Restaurant not found" }, { status: 404 });
  }

  // Resolve menu items with authoritative prices.
  const ids = Array.from(cleaned.keys());
  const { data: menuRows } = await supabaseAdmin
    .from("menu_items")
    .select("id, name, price, in_stock, restaurant_id")
    .in("id", ids);

  const map = new Map((menuRows ?? []).map((m) => [m.id, m]));
  for (const id of ids) {
    const m = map.get(id);
    if (!m || m.restaurant_id !== restaurant.id) {
      return NextResponse.json(
        { ok: false, error: `Menu item ${id} not available` },
        { status: 400 },
      );
    }
    if (!m.in_stock) {
      return NextResponse.json(
        { ok: false, error: `${m.name} is currently out of stock` },
        { status: 400 },
      );
    }
  }

  // Compute totals.
  let subtotal = 0;
  for (const id of ids) {
    const m = map.get(id)!;
    subtotal += Number(m.price) * cleaned.get(id)!;
  }
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;
  const amountPaise = total * 100;

  // Create the Razorpay order.
  try {
    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `tbl-${tableNumber}-${Date.now()}`,
      notes: {
        restaurant_slug: slug,
        table_number: String(tableNumber),
      },
    });

    return NextResponse.json({
      ok: true,
      razorpay_order_id: rzpOrder.id,
      amount: amountPaise,
      currency: "INR",
      key_id: getPublicRazorpayKey(),
      computed: { subtotal, gst, total },
    });
  } catch (err) {
    console.error("[create-order] Razorpay error:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to create payment order",
      },
      { status: 500 },
    );
  }
}
