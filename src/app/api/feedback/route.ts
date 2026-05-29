import { NextRequest, NextResponse } from "next/server";
import { submitFeedback } from "@/lib/feedback/submitFeedback";
import { FeedbackInsert } from "@/lib/types/feedback";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/feedback
 *
 *   Body:
 *     {
 *       restaurant_slug: string,
 *       table_number?: number,
 *       order_id?: string,
 *       overall_rating: 1..5,
 *       food_rating:    1..5,
 *       service_rating: 1..5,
 *       comment?: string
 *     }
 *
 *   Public route — customers submit feedback without authentication.
 *   Duplicate submissions for the same order_id are rejected by the
 *   unique partial index on `feedback(order_id)` and surfaced as
 *   { ok:false, code:"DUPLICATE", error:... }.
 */
export async function POST(req: NextRequest) {
  let body: FeedbackInsert;
  try {
    body = (await req.json()) as FeedbackInsert;
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_PAYLOAD", error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const result = await submitFeedback(body);
  if (!result.ok) {
    const status =
      result.code === "RESTAURANT_NOT_FOUND" || result.code === "ORDER_NOT_FOUND"
        ? 404
        : result.code === "DUPLICATE"
          ? 409
          : result.code === "DB_INSERT_FAILED"
            ? 500
            : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result, { status: 201 });
}
