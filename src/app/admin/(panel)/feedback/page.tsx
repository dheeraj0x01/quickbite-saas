import { getRestaurantBySlug } from "@/lib/queries/restaurants";
import {
  getFeedbackStats,
  getRatedItems,
} from "@/lib/feedback/getFeedbackStats";
import FeedbackBoard from "@/app/components/admin/FeedbackBoard";
import { requirePageRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";

const DEFAULT_SLUG = "spice-garden";

type SearchParams = Promise<{ slug?: string }>;

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePageRole(["owner", "manager"], "/admin/feedback");
  const { slug = DEFAULT_SLUG } = await searchParams;

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    return (
      <div>
        <header className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Feedback</h1>
          </div>
        </header>
        <div className="admin-panel admin-panel-body">
          Restaurant <code>{slug}</code> not found.
        </div>
      </div>
    );
  }

  const [stats, ratedItems] = await Promise.all([
    getFeedbackStats(restaurant.id),
    getRatedItems(restaurant.id),
  ]);

  return (
    <div>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Feedback</h1>
          <div className="admin-page-sub">
            {restaurant.name} • Customer reviews & ratings
          </div>
        </div>
      </header>

      <FeedbackBoard
        stats={stats}
        topItems={ratedItems.topItems}
        lowestItems={ratedItems.lowestItems}
      />
    </div>
  );
}
