import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { defaultLandingForRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/auth/sync
 *   Sets the lightweight `qb_role` cookie used by the middleware. Called
 *   immediately after a successful login. The cookie is **not** the source
 *   of truth — page-level `requirePageRole` and the API guards always
 *   re-validate against `profiles`.
 *
 * DELETE /api/auth/sync
 *   Clears the role cookie (called from LogoutButton).
 */

const COOKIE = "qb_role";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    const res = NextResponse.json(
      { ok: false, error: "Not authenticated" },
      { status: 401 },
    );
    res.cookies.delete(COOKIE);
    return res;
  }
  const res = NextResponse.json({
    ok: true,
    role: user.role,
    landing: defaultLandingForRole(user.role),
  });
  res.cookies.set(COOKIE, user.role, {
    httpOnly: false, // not a secret — matches anon-key cookie scope
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
