import { NextRequest, NextResponse } from "next/server";
import {
  getRestaurantSettings,
  updateRestaurantSettings,
} from "@/lib/admin/settings";
import { requireApiRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = await requireApiRole(req.nextUrl.pathname, ["owner"]);
  if (guard instanceof NextResponse) return guard;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
  const settings = await getRestaurantSettings(slug);
  if (!settings) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, settings });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireApiRole(req.nextUrl.pathname, ["owner"]);
  if (guard instanceof NextResponse) return guard;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
  const existing = await getRestaurantSettings(slug);
  if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const allowed = [
    "name",
    "subtitle",
    "rating",
    "prep_time",
    "logo_url",
    "banner_url",
    "contact_phone",
    "address",
    "open_hours",
    "gst_percent",
    "theme_color",
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }
  const updated = await updateRestaurantSettings(existing.id, patch);
  if (!updated) return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  return NextResponse.json({ ok: true, settings: updated });
}
