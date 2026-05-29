import { NextRequest, NextResponse } from "next/server";
import { getKitchenOrders } from "@/lib/kitchen/getKitchenOrders";
import { requireApiRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/kitchen/orders?restaurantId=<uuid>&limit=50
 * Auth: owner | manager | kitchen
 */
export async function GET(req: NextRequest) {
  const guard = await requireApiRole(req.nextUrl.pathname, [
    "owner",
    "manager",
    "kitchen",
  ]);
  if (guard instanceof NextResponse) return guard;

  const restaurantId = req.nextUrl.searchParams.get("restaurantId");
  const limitParam = req.nextUrl.searchParams.get("limit");
  if (!restaurantId) {
    return NextResponse.json(
      { ok: false, error: "Missing restaurantId" },
      { status: 400 },
    );
  }
  const limit = Math.min(Math.max(Number(limitParam) || 50, 1), 200);
  const orders = await getKitchenOrders(restaurantId, limit);
  return NextResponse.json({ ok: true, orders });
}
