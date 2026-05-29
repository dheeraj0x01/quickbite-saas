import { NextRequest, NextResponse } from "next/server";
import { getRestaurantBySlug } from "@/lib/queries/restaurants";
import { addTable, listTables, nextTableNumber } from "@/lib/admin/tables";
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
  const tables = await listTables(restaurant.id);
  return NextResponse.json({ ok: true, tables });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiRole(req.nextUrl.pathname, ["owner", "manager"]);
  if (guard instanceof NextResponse) return guard;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return NextResponse.json({ ok: false, error: "Restaurant not found" }, { status: 404 });

  let body: { table_number?: number };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const tableNumber = Number.isInteger(body.table_number) && body.table_number! > 0
    ? body.table_number!
    : await nextTableNumber(restaurant.id);

  const tbl = await addTable(restaurant.id, tableNumber);
  if (!tbl) return NextResponse.json({ ok: false, error: "Failed to add table (number may exist)" }, { status: 400 });
  return NextResponse.json({ ok: true, table: tbl }, { status: 201 });
}
