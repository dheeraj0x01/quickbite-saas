import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic"; // always run live, never cache

/**
 * Supabase integration health-check.
 *
 *   GET /api/health
 *
 * For each known table:
 *   - Verifies that the connection works
 *   - Reports the row count
 *   - Returns up to 3 sample rows
 *
 * If any table errors out, the response includes the Supabase error so you
 * can see exactly what went wrong (missing table, RLS denial, bad key, etc.).
 *
 * This route runs only on the server, so the service-role key never reaches
 * the browser.
 */

const TABLES = [
  "restaurants",
  "restaurant_tables",
  "menu_items",
  "orders",
  "order_items",
] as const;

type TableReport = {
  table: string;
  ok: boolean;
  count: number | null;
  sample: unknown[];
  error: string | null;
};

export async function GET() {
  const checks: TableReport[] = [];

  for (const table of TABLES) {
    try {
      const { data, count, error } = await supabaseAdmin
        .from(table)
        .select("*", { count: "exact" })
        .limit(3);

      checks.push({
        table,
        ok: !error,
        count: count ?? null,
        sample: data ?? [],
        error: error ? error.message : null,
      });
    } catch (err) {
      checks.push({
        table,
        ok: false,
        count: null,
        sample: [],
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const allOk = checks.every((c) => c.ok);

  return NextResponse.json(
    {
      status: allOk ? "ok" : "error",
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 500 },
  );
}
