import MenuTable from "@/app/components/admin/MenuTable";
import { requirePageRole } from "@/lib/auth/requireRole";

const DEFAULT_SLUG = "spice-garden";

type SearchParams = Promise<{ slug?: string }>;

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePageRole(["owner", "manager"], "/admin/menu");
  const { slug = DEFAULT_SLUG } = await searchParams;
  return <MenuTable slug={slug} />;
}
