import TableManager from "@/app/components/admin/TableManager";
import { requirePageRole } from "@/lib/auth/requireRole";

const DEFAULT_SLUG = "spice-garden";

type SearchParams = Promise<{ slug?: string }>;

export default async function AdminTablesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePageRole(["owner", "manager"], "/admin/tables");
  const { slug = DEFAULT_SLUG } = await searchParams;
  return <TableManager slug={slug} />;
}
