import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ORDER_STATUSES, OrderStatus } from "@/lib/types/kitchen";

export type UpdateStatusResult =
  | { ok: true; orderId: string; status: OrderStatus }
  | { ok: false; error: string };

/**
 * Server-side helper to advance an order's status. Validates the status
 * value is one of our supported strings, then performs a single UPDATE.
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<UpdateStatusResult> {
  if (typeof orderId !== "string" || !orderId) {
    return { ok: false, error: "Missing order id." };
  }
  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    return { ok: false, error: `Invalid status "${status}".` };
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    console.error("[updateOrderStatus] error:", error.message);
    return { ok: false, error: "Failed to update status." };
  }

  return { ok: true, orderId, status: status as OrderStatus };
}
