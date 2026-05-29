import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireApiRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/upload  (owner | manager)
 *
 * Multipart form-data:
 *   - file: image binary
 *   - bucket?: defaults to "menu-images"
 */
export async function POST(req: NextRequest) {
  const guard = await requireApiRole(req.nextUrl.pathname, ["owner", "manager"]);
  if (guard instanceof NextResponse) return guard;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data" }, { status: 400 });
  }
  const file = form.get("file");
  const bucket = (form.get("bucket") as string | null) ?? "menu-images";

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "File too large (max 5MB)" }, { status: 400 });
  }

  const ext = mimeToExt(file.type) ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, new Uint8Array(arrayBuffer), {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  if (error) {
    console.error("[admin/upload] error:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}

function mimeToExt(mime: string): string | null {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    default: return null;
  }
}
