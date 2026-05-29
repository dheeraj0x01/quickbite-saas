/**
 * Feedback / rating shared types.
 * Mirrors the Supabase `feedback` table created in migration 007.
 */

export type FeedbackRow = {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  order_id: string | null;
  overall_rating: number;
  food_rating: number;
  service_rating: number;
  comment: string | null;
  created_at: string;
};

export type FeedbackInsert = {
  restaurant_slug: string;
  table_number?: number;
  order_id?: string;
  overall_rating: number;
  food_rating: number;
  service_rating: number;
  comment?: string;
};

export type FeedbackStats = {
  totalReviews: number;
  averageOverall: number;
  averageFood: number;
  averageService: number;
  /** Distribution: index 0..4 maps to 1..5 stars (counts and percent). */
  distribution: { stars: number; count: number; percent: number }[];
  recent: FeedbackRow[];
};
