import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { canAccess, Role } from "@/lib/auth/permissions";

/**
 * Edge middleware:
 *   1. Refresh Supabase session cookies on every request.
 *   2. Gate /admin/* and /api/admin/* by authentication + role.
 *
 * Public routes (customer ordering, login, public APIs) pass through
 * untouched.
 */

const PUBLIC_PATH_PREFIXES = [
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/login",
  "/api/health",
  "/api/orders",   // customer order placement
  "/r/",           // customer table flow
];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

function needsAuth(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/kitchen/") ||
    /^\/api\/orders\/[^/]+\/status$/.test(pathname)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always start with a passthrough response we can mutate cookies on.
  let response = NextResponse.next({ request: req });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars aren't ready (e.g. local first-run), skip auth.
  if (!supabaseUrl || !anonKey) return response;

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        response = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh session on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes pass through (cookies still refreshed above).
  if (isPublicPath(pathname) || !needsAuth(pathname)) return response;

  // Not signed in → redirect (or 401 for APIs).
  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Look up the user's role from the request cookie cache (avoid a DB call
  // on every navigation). We embed the role in a lightweight cookie set at
  // login time; if it's missing we fall back to allowing the request through
  // and let the page-level guards do the strict check.
  const cachedRole = req.cookies.get("qb_role")?.value as Role | undefined;

  if (cachedRole && !canAccess(cachedRole, pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 },
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = cachedRole === "kitchen" ? "/admin/kitchen" : "/admin/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except:
     *   - static files (_next/static, _next/image)
     *   - image extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?)).*)",
  ],
};
