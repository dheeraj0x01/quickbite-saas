import CategoryManager from "@/app/components/admin/CategoryManager";
import { requirePageRole } from "@/lib/auth/requireRole";

const DEFAULT_SLUG = "spice-garden";

type SearchParams = Promise<{ slug?: string }>;

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePageRole(["owner", "manager"], "/admin/categories");
  const { slug = DEFAULT_SLUG } = await searchParams;
  return <CategoryManager slug={slug} />;
}
