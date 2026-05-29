import SettingsForm from "@/app/components/admin/SettingsForm";
import { requirePageRole } from "@/lib/auth/requireRole";

const DEFAULT_SLUG = "spice-garden";

type SearchParams = Promise<{ slug?: string }>;

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePageRole(["owner"], "/admin/settings");
  const { slug = DEFAULT_SLUG } = await searchParams;
  return <SettingsForm slug={slug} />;
}
