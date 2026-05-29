import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/orders/createOrder";
import { CreateOrderPayload } from "@/lib/types/order";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/orders
 *
 * Body:
 *   {
 *     "restaurant_slug": "spice-garden",
 *     "table_number": 4,
 *     "items": [{ "menu_item_id": "<uuid>", "quantity": 2 }],
 *     "payment_method": "upi" | "cash"
 *   }
 *
 * Response on success: 201 + the created order summary.
 * Response on failure: 400/404/500 with `{ ok: false, code, error }`.
 *
 * Notes:
 *  - Uses the privileged supabaseAdmin client server-side. The browser
 *    never sees the service-role key.
 *  - All totals are recomputed server-side, the client total is ignored.
 */
export async function POST(req: NextRequest) {
  let payload: CreateOrderPayload;
  try {
    payload = (await req.json()) as CreateOrderPayload;
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_PAYLOAD", error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const result = await createOrder(payload);

  if (!result.ok) {
    const status =
      result.code === "RESTAURANT_NOT_FOUND" || result.code === "TABLE_NOT_FOUND"
        ? 404
        : result.code === "DB_INSERT_FAILED"
          ? 500
          : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 201 });
}
