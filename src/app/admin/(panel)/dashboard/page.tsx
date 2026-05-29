import { getRestaurantBySlug } from "@/lib/queries/restaurants";
import { getDashboardStats } from "@/lib/admin/analytics";
import DashboardCards from "@/app/components/admin/DashboardCards";
import { requirePageRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";

const DEFAULT_SLUG = "spice-garden";

type SearchParams = Promise<{ slug?: string }>;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePageRole(["owner", "manager"], "/admin/dashboard");
  const { slug = DEFAULT_SLUG } = await searchParams;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return (
      <div>
        <header className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
          </div>
        </header>
        <div className="admin-panel admin-panel-body">
          Restaurant <code>{slug}</code> not found.
        </div>
      </div>
    );
  }

  const stats = await getDashboardStats(restaurant.id);

  return (
    <div>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <div className="admin-page-sub">
            {restaurant.name} • Live operations overview
          </div>
        </div>
        <a className="admin-btn" href="/admin/menu">
          + Add Menu Item
        </a>
      </header>
      <DashboardCards stats={stats} />
    </div>
  );
}
