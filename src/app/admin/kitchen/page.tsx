import "../../styles/kitchen.css";
import { getRestaurantBySlug } from "@/lib/queries/restaurants";
import { getKitchenOrders } from "@/lib/kitchen/getKitchenOrders";
import KitchenBoard from "@/app/components/kitchen/KitchenBoard";
import { requirePageRole } from "@/lib/auth/requireRole";

/**
 * Realtime Kitchen Display System
 *
 *   GET /admin/kitchen                 (defaults to ?slug=spice-garden)
 *   GET /admin/kitchen?slug=...        (any restaurant in Supabase)
 *
 * Server Component:
 *   - Resolves the restaurant.
 *   - Loads the latest 50 hydrated orders as the initial snapshot.
 *   - Hands everything to <KitchenBoard /> which subscribes to Supabase
 *     Realtime and patches the list as orders flow in / change.
 */

export const dynamic = "force-dynamic";

const DEFAULT_SLUG = "spice-garden";

type SearchParams = Promise<{ slug?: string }>;

export default async function KitchenPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePageRole(["owner", "manager", "kitchen"], "/admin/kitchen");
  const { slug = DEFAULT_SLUG } = await searchParams;

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    return (
      <main className="kds-page">
        <div className="kds-page-inner">
          <div className="kds-empty">
            Restaurant <code>{slug}</code> not found. Run the seed script,
            then refresh.
          </div>
        </div>
      </main>
    );
  }

  const initialOrders = await getKitchenOrders(restaurant.id, 50);

  return (
    <KitchenBoard
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      initialOrders={initialOrders}
    />
  );
}
