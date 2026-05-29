import "../../styles/admin.css";
import Sidebar from "@/app/components/admin/Sidebar";
import { requirePageRole } from "@/lib/auth/requireRole";

/**
 * Shared shell for the admin pages that live in the (panel) route group.
 * Server Component: enforces authentication for everyone landing here,
 * and passes the resolved user into the sidebar.
 *
 * Per-page access (e.g. settings = owner only) is enforced inside each
 * page via `requirePageRole`, so the sidebar can stay unaware of role
 * specifics.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole(["owner", "manager", "kitchen"]);

  return (
    <div className="admin-shell">
      <Sidebar user={{ email: user.email, role: user.role }} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
