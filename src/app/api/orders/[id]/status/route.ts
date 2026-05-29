import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/kitchen/updateOrderStatus";
import { requireApiRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PATCH /api/orders/:id/status   Body: { "status": "preparing" }
 * Auth: owner | manager | kitchen
 */
export async function PATCH(
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

  let body: { status?: string };
  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const result = await updateOrderStatus(id, body?.status ?? "");
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
