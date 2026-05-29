import { NextRequest, NextResponse } from "next/server";
import { getRestaurantBySlug } from "@/lib/queries/restaurants";
import { deleteCategory, updateCategory } from "@/lib/admin/categories";
import { requireApiRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  let body: { label?: string; emoji?: string | null; visible?: boolean; display_order?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const cat = await updateCategory(restaurant.id, id, body);
  if (!cat) return NextResponse.json({ ok: false, error: "Failed to update" }, { status: 500 });
  return NextResponse.json({ ok: true, category: cat });
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
  const ok = await deleteCategory(restaurant.id, id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 500 });
}
