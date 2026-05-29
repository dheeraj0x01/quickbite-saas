import { NextRequest, NextResponse } from "next/server";
import { getRestaurantBySlug } from "@/lib/queries/restaurants";
import { createCategory, listCategories } from "@/lib/admin/categories";
import { requireApiRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await requireApiRole(req.nextUrl.pathname, ["owner", "manager"]);
  if (guard instanceof NextResponse) return guard;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return NextResponse.json({ ok: false, error: "Restaurant not found" }, { status: 404 });
  const categories = await listCategories(restaurant.id);
  return NextResponse.json({ ok: true, categories });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiRole(req.nextUrl.pathname, ["owner", "manager"]);
  if (guard instanceof NextResponse) return guard;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return NextResponse.json({ ok: false, error: "Restaurant not found" }, { status: 404 });

  let body: { slug?: string; label?: string; emoji?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.slug || !body.label) {
    return NextResponse.json({ ok: false, error: "slug and label are required" }, { status: 400 });
  }
  const cat = await createCategory(restaurant.id, {
    slug: body.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label: body.label,
    emoji: body.emoji,
  });
  if (!cat) return NextResponse.json({ ok: false, error: "Failed to create" }, { status: 500 });
  return NextResponse.json({ ok: true, category: cat }, { status: 201 });
}
