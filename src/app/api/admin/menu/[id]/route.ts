import { NextRequest, NextResponse } from "next/server";
import { getRestaurantBySlug } from "@/lib/queries/restaurants";
import { deleteMenuItem, updateMenuItem } from "@/lib/admin/menu";
import { MenuItemInput } from "@/lib/types/admin";
import { requireApiRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PATCH  /api/admin/menu/:id?slug=...  → partial update  (owner | manager)
 * DELETE /api/admin/menu/:id?slug=...  → delete          (owner | manager)
 */
export async function PATCH(
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

  let body: Partial<MenuItemInput>;
  try {
    body = (await req.json()) as Partial<MenuItemInput>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const item = await updateMenuItem(restaurant.id, id, body);
  if (!item) return NextResponse.json({ ok: false, error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ ok: true, item });
}

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

  const ok = await deleteMenuItem(restaurant.id, id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 500 });
}
