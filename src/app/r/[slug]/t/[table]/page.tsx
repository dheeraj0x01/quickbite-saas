import {
  getRestaurantBySlug,
  getTableByNumber,
} from "@/lib/queries/restaurants";
import {
  deriveCategories,
  getMenuItemsByRestaurant,
} from "@/lib/queries/menu";
import DynamicRestaurantMenu from "@/app/components/DynamicRestaurantMenu";
import NotFoundCard from "@/app/components/NotFoundCard";

/**
 * Dynamic per-restaurant, per-table menu page.
 *
 *   /r/[slug]/t/[table]
 *
 * Examples:
 *   /r/spice-garden/t/1
 *   /r/spice-garden/t/10
 *
 * This is a Server Component — Supabase queries run on the server,
 * the resolved data is shipped to the browser, and the client takes over
 * for cart interactions.
 */

export const dynamic = "force-dynamic";

type PageParams = {
  params: Promise<{ slug: string; table: string }>;
};

export default async function RestaurantTablePage({ params }: PageParams) {
  const { slug, table } = await params;

  // 1. Validate the table parameter is a positive integer.
  const tableNumber = Number(table);
  const tableIsValid =
    Number.isInteger(tableNumber) && tableNumber > 0 && tableNumber <= 9999;

  // 2. Look up the restaurant.
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    return (
      <NotFoundCard
        emoji="🏷️"
        title="Restaurant Not Found"
        description={`We couldn't find a restaurant with the link "${slug}". Please scan a valid QR code from the table.`}
      />
    );
  }

  // 3. Look up the table within that restaurant.
  if (!tableIsValid) {
    return (
      <NotFoundCard
        emoji="🪑"
        title="Invalid Table"
        description={`"${table}" is not a valid table number. Try scanning the QR code on your table again.`}
      />
    );
  }

  const tableRow = await getTableByNumber(restaurant.id, tableNumber);
  if (!tableRow) {
    return (
      <NotFoundCard
        emoji="🪑"
        title="Invalid Table"
        description={`Table ${tableNumber} is not configured for ${restaurant.name}. Please scan the QR code on your table.`}
      />
    );
  }

  // 4. Load this restaurant's menu and derive its category list.
  const menuItems = await getMenuItemsByRestaurant(restaurant.id);
  const categories = deriveCategories(menuItems);

  return (
    <DynamicRestaurantMenu
      restaurant={restaurant}
      tableNumber={tableNumber}
      menuItems={menuItems}
      categories={categories}
    />
  );
}
