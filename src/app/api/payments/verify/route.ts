import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/payments/verifySignature";
import { createOrder } from "@/lib/orders/createOrder";
import { CreateOrderPayload } from "@/lib/types/order";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/payments/verify
 *
 *   Body:
 *     {
 *       razorpay_order_id, razorpay_payment_id, razorpay_signature,
 *       restaurant_slug, table_number,
 *       items: [{ menu_item_id, quantity }]
 *     }
 *
 *   Steps:
 *     1. Verify the HMAC signature server-side.
 *     2. Fetch the Razorpay order to read its amount + status.
 *     3. Defend against double-creation: refuse if an order with this
 *        razorpay_order_id already exists.
 *     4. Call `createOrder` with the verified payment context — that
 *        helper recomputes totals from the DB and matches them against
 *        the amount Razorpay charged. Only then is the row inserted into
 *        `orders` and `order_items`, which is what the kitchen subscribes
 *        to. Result: kitchen sees the order ONLY after a successful, paid
 *        and verified Razorpay payment.
 */
export async function POST(req: NextRequest) {
  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
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

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    restaurant_slug,
    table_number,
    items,
  } = body;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !restaurant_slug ||
    !table_number ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return NextResponse.json(
      { ok: false, error: "Missing payment / cart fields" },
      { status: 400 },
    );
  }

  // 1. Signature check.
  const ok = verifyRazorpaySignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Invalid payment signature" },
      { status: 400 },
    );
  }

  // 2. Idempotency: refuse duplicate verify calls for the same RZP order.
  const { data: existing } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("razorpay_order_id", razorpay_order_id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "This payment has already been processed" },
      { status: 409 },
    );
  }

  // 3. Look up Razorpay's view of the order to read the authoritative amount.
  let expectedAmountPaise = 0;
  try {
    const { getRazorpay } = await import("@/lib/payments/razorpay");
    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.fetch(razorpay_order_id);
    expectedAmountPaise = Number(rzpOrder.amount);
  } catch (err) {
    console.error("[verify] failed to fetch Razorpay order:", err);
    return NextResponse.json(
      { ok: false, error: "Could not fetch payment order" },
      { status: 502 },
    );
  }

  // 4. Build the payload for the order creator with verified payment context.
  const payload: CreateOrderPayload = {
    restaurant_slug,
    table_number,
    items,
    payment_method: "online",
    payment: {
      razorpay_order_id,
      razorpay_payment_id,
      expected_amount_paise: expectedAmountPaise,
    },
  };

  const result = await createOrder(payload);
  if (!result.ok) {
    const status =
      result.code === "RESTAURANT_NOT_FOUND" || result.code === "TABLE_NOT_FOUND"
        ? 404
        : result.code === "AMOUNT_MISMATCH"
          ? 400
          : result.code === "DB_INSERT_FAILED"
            ? 500
            : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 201 });
}
