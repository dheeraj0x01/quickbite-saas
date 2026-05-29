import { supabaseAdmin } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/auth/requireRole";

/**
 * Supabase Integration Test Page
 *
 *   Open: http://localhost:3000/admin/test
 *
 * This is a Server Component, so it queries Supabase directly during render
 * using the service-role client. It displays:
 *   - Whether each table is reachable
 *   - The row count for each
 *   - A small sample of rows so you can see your data
 *
 * Once your integration is working, you can delete this file or repurpose it
 * for a future internal admin dashboard.
 */

export const dynamic = "force-dynamic"; // never cache health-check results

const TABLES = [
  "restaurants",
  "restaurant_tables",
  "menu_items",
  "orders",
  "order_items",
] as const;

type Report = {
  table: string;
  ok: boolean;
  count: number | null;
  sample: unknown[];
  error: string | null;
};

async function runChecks(): Promise<Report[]> {
  const reports: Report[] = [];
  for (const table of TABLES) {
    try {
      const { data, count, error } = await supabaseAdmin
        .from(table)
        .select("*", { count: "exact" })
        .limit(3);

      reports.push({
        table,
        ok: !error,
        count: count ?? null,
        sample: data ?? [],
        error: error?.message ?? null,
      });
    } catch (err) {
      reports.push({
        table,
        ok: false,
        count: null,
        sample: [],
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return reports;
}

export default async function TestPage() {
  await requirePageRole(["owner"], "/admin/test");
  const reports = await runChecks();
  const allOk = reports.every((r) => r.ok);

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
        background: "#0b0c10",
        color: "#f1f3f9",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Supabase Integration Test
      </h1>
      <p style={{ color: "#8e96b7", marginBottom: 24, fontSize: 13 }}>
        Project URL:{" "}
        <code style={{ color: "#E06A3B" }}>
          {process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(not set)"}
        </code>
      </p>

      <div
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          marginBottom: 24,
          background: allOk ? "#0f3a2a" : "#3b1414",
          border: `1px solid ${allOk ? "#10B981" : "#EF4444"}`,
          fontWeight: 700,
        }}
      >
        {allOk
          ? "✅ All tables reachable. Integration is working."
          : "❌ Some tables failed. See details below."}
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {reports.map((r) => (
          <div
            key={r.table}
            style={{
              border: `1px solid ${r.ok ? "#2E324E" : "#7f1d1d"}`,
              background: "#131520",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>
                {r.ok ? "✅" : "❌"} {r.table}
              </h2>
              <span style={{ fontSize: 12, color: "#8e96b7" }}>
                {r.ok ? `${r.count ?? 0} rows` : "ERROR"}
              </span>
            </div>

            {r.error && (
              <pre
                style={{
                  background: "#1f0a0a",
                  color: "#fca5a5",
                  padding: 10,
                  borderRadius: 6,
                  fontSize: 12,
                  whiteSpace: "pre-wrap",
                }}
              >
                {r.error}
              </pre>
            )}

            {r.ok && r.sample.length > 0 && (
              <pre
                style={{
                  background: "#0b0c10",
                  border: "1px solid #2E324E",
                  padding: 10,
                  borderRadius: 6,
                  fontSize: 11.5,
                  overflowX: "auto",
                  margin: 0,
                }}
              >
                {JSON.stringify(r.sample, null, 2)}
              </pre>
            )}

            {r.ok && r.sample.length === 0 && (
              <div style={{ fontSize: 12, color: "#8e96b7" }}>
                Table is empty — connection works, but no rows yet.
              </div>
            )}
          </div>
        ))}
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: "#8e96b7" }}>
        Tip: also try{" "}
        <code style={{ color: "#E06A3B" }}>/api/health</code> for the raw JSON
        response.
      </p>
    </div>
  );
}
