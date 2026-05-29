import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { RestaurantSettingsRow } from "@/lib/types/admin";

const FIELDS =
  "id, slug, name, subtitle, rating, prep_time, logo_url, banner_url, contact_phone, address, open_hours, gst_percent, theme_color";

export async function getRestaurantSettings(
  slug: string,
): Promise<RestaurantSettingsRow | null> {
  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select(FIELDS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[admin/settings] get error:", error.message);
    return null;
  }
  return (data as RestaurantSettingsRow | null) ?? null;
}

export async function updateRestaurantSettings(
  id: string,
  patch: Partial<Omit<RestaurantSettingsRow, "id" | "slug">>,
): Promise<RestaurantSettingsRow | null> {
  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .update(patch)
    .eq("id", id)
    .select(FIELDS)
    .single();
  if (error) {
    console.error("[admin/settings] update error:", error.message);
    return null;
  }
  return data as RestaurantSettingsRow;
}
