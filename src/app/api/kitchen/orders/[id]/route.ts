import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getKitchenOrders } from "@/lib/kitchen/getKitchenOrders";
import { requireApiRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/kitchen/orders/:id
 * Auth: owner | manager | kitchen
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiRole(req.nextUrl.pathname, [
    "owner",
    "manager",
    "kitchen",
  ]);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing order id" },
      { status: 400 },
    );
  }

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("restaurant_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json(
      { ok: false, error: "Order not found" },
      { status: 404 },
    );
  }

  const orders = await getKitchenOrders(order.restaurant_id as string, 200);
  const found = orders.find((o) => o.id === id) ?? null;
  return NextResponse.json({ ok: true, order: found });
}
