import { NextRequest, NextResponse } from "next/server";
import { getRestaurantBySlug } from "@/lib/queries/restaurants";
import { deleteTable } from "@/lib/admin/tables";
import { requireApiRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiRole(req.nextUrl.pathname, ["owner", "manager"]);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return NextResponse.json({ ok: false, error: "Restaurant not found" }, { status: 404 });
  const ok = await deleteTable(restaurant.id, id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 500 });
}
