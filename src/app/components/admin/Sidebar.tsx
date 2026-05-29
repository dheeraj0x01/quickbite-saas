"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@/lib/auth/permissions";
import LogoutButton from "@/app/components/auth/LogoutButton";

type NavItem = { href: string; label: string; icon: string; roles: Role[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊", roles: ["owner", "manager"] },
  { href: "/admin/menu", label: "Menu", icon: "🍽", roles: ["owner", "manager"] },
  { href: "/admin/categories", label: "Categories", icon: "🗂", roles: ["owner", "manager"] },
  { href: "/admin/tables", label: "Tables", icon: "🪑", roles: ["owner", "manager"] },
  { href: "/admin/qr", label: "QR Codes", icon: "🔳", roles: ["owner", "manager"] },
  { href: "/admin/kitchen", label: "Kitchen", icon: "👨‍🍳", roles: ["owner", "manager", "kitchen"] },
  { href: "/admin/feedback", label: "Feedback", icon: "⭐", roles: ["owner", "manager"] },
  { href: "/admin/settings", label: "Settings", icon: "⚙️", roles: ["owner"] },
];

type SidebarProps = {
  user?: { email: string; role: Role };
};

/**
 * Admin sidebar — filters navigation entries based on the signed-in
 * user's role and shows their identity + a sign-out button at the bottom.
 */
export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const visible = NAV_ITEMS.filter(
    (n) => !user || n.roles.includes(user.role),
  );

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <div className="admin-brand-mark">🍴</div>
        <div>
          <div className="admin-brand-name">QuickBite</div>
          <div className="admin-brand-sub">Admin Console</div>
        </div>
      </div>

      <nav className="admin-nav">
        {visible.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link ${active ? "active" : ""}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="admin-sidebar-user">
          <div className="admin-sidebar-user-meta">
            <div className="admin-sidebar-user-email" title={user.email}>
              {user.email}
            </div>
            <div className="admin-sidebar-user-role">{user.role}</div>
          </div>
          <LogoutButton />
        </div>
      )}
    </aside>
  );
}
