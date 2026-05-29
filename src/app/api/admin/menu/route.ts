import { NextRequest, NextResponse } from "next/server";
import { getRestaurantBySlug } from "@/lib/queries/restaurants";
import { createMenuItem, listMenuItemsAdmin } from "@/lib/admin/menu";
import { MenuItemInput } from "@/lib/types/admin";
import { requireApiRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET  /api/admin/menu?slug=spice-garden  → list items
 * POST /api/admin/menu?slug=spice-garden  → create item
 *
 * Auth: owner | manager
 */
export async function GET(req: NextRequest) {
  const guard = await requireApiRole(req.nextUrl.pathname, ["owner", "manager"]);
  if (guard instanceof NextResponse) return guard;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return NextResponse.json({ ok: false, error: "Restaurant not found" }, { status: 404 });
  const items = await listMenuItemsAdmin(restaurant.id);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiRole(req.nextUrl.pathname, ["owner", "manager"]);
  if (guard instanceof NextResponse) return guard;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return NextResponse.json({ ok: false, error: "Restaurant not found" }, { status: 404 });

  let body: MenuItemInput;
  try {
    body = (await req.json()) as MenuItemInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.name || !body?.category || typeof body.price !== "number") {
    return NextResponse.json({ ok: false, error: "name, category and price are required" }, { status: 400 });
  }
  const item = await createMenuItem(restaurant.id, body);
  if (!item) return NextResponse.json({ ok: false, error: "Failed to create" }, { status: 500 });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
