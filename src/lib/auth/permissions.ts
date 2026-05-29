/**
 * Role + permission matrix for the admin panel.
 *
 * Roles:
 *   owner   — everything
 *   manager — menu, categories, tables, settings, dashboard, kitchen
 *   kitchen — kitchen dashboard only
 */

export type Role = "owner" | "manager" | "kitchen";

export const ROLES: Role[] = ["owner", "manager", "kitchen"];

/**
 * URL prefixes (case-insensitive) and the roles allowed to access them.
 * The longest matching prefix wins.
 */
const ROUTE_ACCESS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin/kitchen", roles: ["owner", "manager", "kitchen"] },
  { prefix: "/admin/dashboard", roles: ["owner", "manager"] },
  { prefix: "/admin/menu", roles: ["owner", "manager"] },
  { prefix: "/admin/categories", roles: ["owner", "manager"] },
  { prefix: "/admin/tables", roles: ["owner", "manager"] },
  { prefix: "/admin/qr", roles: ["owner", "manager"] },
  { prefix: "/admin/settings", roles: ["owner"] },
  { prefix: "/admin/test", roles: ["owner"] },
  { prefix: "/admin", roles: ["owner", "manager", "kitchen"] },

  // API routes follow the same access rules as their UI counterparts.
  { prefix: "/api/admin/settings", roles: ["owner"] },
  { prefix: "/api/admin", roles: ["owner", "manager"] },
  { prefix: "/api/kitchen", roles: ["owner", "manager", "kitchen"] },
  { prefix: "/api/orders/", roles: ["owner", "manager", "kitchen"] }, // status updates
];

/** Returns the roles allowed to view the given path, or null if public. */
export function rolesForPath(pathname: string): Role[] | null {
  const lower = pathname.toLowerCase();
  // Find the longest matching prefix.
  let best: { prefix: string; roles: Role[] } | null = null;
  for (const entry of ROUTE_ACCESS) {
    if (lower.startsWith(entry.prefix)) {
      if (!best || entry.prefix.length > best.prefix.length) best = entry;
    }
  }
  return best?.roles ?? null;
}

/** Default landing route per role after login. */
export function defaultLandingForRole(role: Role): string {
  if (role === "kitchen") return "/admin/kitchen";
  return "/admin/dashboard";
}

/** Whether a role has access to a given path. */
export function canAccess(role: Role | null | undefined, pathname: string) {
  const allowed = rolesForPath(pathname);
  if (!allowed) return true; // public
  if (!role) return false;
  return allowed.includes(role);
}
