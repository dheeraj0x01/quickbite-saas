import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getCurrentUser, AuthUser } from "./getUser";
import { Role, canAccess } from "./permissions";

/**
 * Server Component / Server Action helper:
 *   const user = await requirePageRole(["owner", "manager"]);
 *
 * Redirects to /login (with `?next=...`) when not authenticated, or to
 * /admin/dashboard (or /admin/kitchen for kitchen role) when the user
 * lacks permission.
 */
export async function requirePageRole(
  allowed: Role[],
  redirectFromPath?: string,
): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    const next = redirectFromPath ? `?next=${encodeURIComponent(redirectFromPath)}` : "";
    redirect(`/login${next}`);
  }
  if (!allowed.includes(user.role)) {
    redirect(user.role === "kitchen" ? "/admin/kitchen" : "/admin/dashboard");
  }
  return user;
}

/**
 * Route Handler helper:
 *   const guard = await requireApiRole(req, ["owner", "manager"]);
 *   if (guard instanceof NextResponse) return guard;
 *   const user = guard;
 *
 * Returns either the resolved user or a NextResponse the caller should
 * return immediately. Keeps API handlers readable.
 */
export async function requireApiRole(
  pathname: string,
  allowed?: Role[],
): Promise<AuthUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  const allowList = allowed ?? null;
  const ok = allowList ? allowList.includes(user.role) : canAccess(user.role, pathname);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }
  return user;
}
