import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { FeedbackInsert, FeedbackRow } from "@/lib/types/feedback";

export type SubmitFeedbackResult =
  | { ok: true; feedback: FeedbackRow }
  | { ok: false; code: string; error: string };

/**
 * Insert a feedback row, validating ratings + restaurant + order ownership.
 *
 * Duplicate submissions for the same `order_id` are rejected by the unique
 * partial index in 007_feedback.sql; we surface that as DUPLICATE.
 */
export async function submitFeedback(
  input: FeedbackInsert,
): Promise<SubmitFeedbackResult> {
  const slug = (input.restaurant_slug ?? "").trim();
  if (!slug) return { ok: false, code: "INVALID_PAYLOAD", error: "Missing slug." };

  for (const k of ["overall_rating", "food_rating", "service_rating"] as const) {
    const v = Number(input[k]);
    if (!Number.isInteger(v) || v < 1 || v > 5) {
      return {
        ok: false,
        code: "INVALID_PAYLOAD",
        error: `${k} must be an integer 1..5`,
      };
    }
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!restaurant) {
    return { ok: false, code: "RESTAURANT_NOT_FOUND", error: "Restaurant not found." };
  }

  // Look up table id (optional).
  let tableId: string | null = null;
  if (Number.isInteger(input.table_number) && input.table_number! > 0) {
    const { data: t } = await supabaseAdmin
      .from("restaurant_tables")
      .select("id")
      .eq("restaurant_id", restaurant.id)
      .eq("table_number", input.table_number!)
      .maybeSingle();
    tableId = (t?.id as string) ?? null;
  }

  // Validate order belongs to this restaurant if provided.
  if (input.order_id) {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("restaurant_id")
      .eq("id", input.order_id)
      .maybeSingle();
    if (!order || order.restaurant_id !== restaurant.id) {
      return { ok: false, code: "ORDER_NOT_FOUND", error: "Order not found." };
    }
  }

  const { data, error } = await supabaseAdmin
    .from("feedback")
    .insert({
      restaurant_id: restaurant.id,
      table_id: tableId,
      order_id: input.order_id ?? null,
      overall_rating: input.overall_rating,
      food_rating: input.food_rating,
      service_rating: input.service_rating,
      comment: input.comment?.trim() ? input.comment.trim() : null,
    })
    .select("*")
    .single();

  if (error) {
    // Unique violation on order_id → duplicate submission.
    const code =
      error.code === "23505" ? "DUPLICATE" : "DB_INSERT_FAILED";
    const message =
      code === "DUPLICATE"
        ? "You've already submitted feedback for this order."
        : "Failed to save feedback.";
    return { ok: false, code, error: message };
  }

  return { ok: true, feedback: data as FeedbackRow };
}
