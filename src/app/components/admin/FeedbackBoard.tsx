import { FeedbackStats } from "@/lib/types/feedback";

type FeedbackBoardProps = {
  stats: FeedbackStats;
  topItems: { name: string; avg: number; count: number }[];
  lowestItems: { name: string; avg: number; count: number }[];
};

/**
 * Admin feedback dashboard — pure render component.
 * Shows the headline averages, the 5-bar distribution, top/lowest rated
 * dishes, and a recent reviews table.
 */
export default function FeedbackBoard({
  stats,
  topItems,
  lowestItems,
}: FeedbackBoardProps) {
  return (
    <>
      <div className="admin-stat-grid">
        <Stat
          label="Average Rating"
          value={stats.totalReviews > 0 ? `⭐ ${stats.averageOverall} / 5` : "—"}
          accent
        />
        <Stat label="Total Reviews" value={String(stats.totalReviews)} />
        <Stat label="Avg. Food" value={fmt(stats.averageFood)} />
        <Stat label="Avg. Service" value={fmt(stats.averageService)} />
      </div>

      <div className="admin-feedback-row">
        <section className="admin-panel">
          <header className="admin-panel-header">
            <div className="admin-panel-title">Rating Distribution</div>
            <span className="admin-badge muted">
              {stats.totalReviews} reviews
            </span>
          </header>
          <div className="admin-panel-body" style={{ padding: 18 }}>
            {stats.totalReviews === 0 ? (
              <div style={{ color: "#8e96b7", fontSize: 13 }}>
                No feedback yet.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {stats.distribution.map((d) => (
                  <DistributionRow key={d.stars} {...d} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="admin-panel">
          <header className="admin-panel-header">
            <div className="admin-panel-title">Trending</div>
          </header>
          <div className="admin-panel-body">
            <RatedItemList title="Top Rated Items" items={topItems} accent />
            <div style={{ height: 12 }} />
            <RatedItemList title="Lowest Rated Items" items={lowestItems} />
          </div>
        </section>
      </div>

      <section className="admin-panel">
        <header className="admin-panel-header">
          <div className="admin-panel-title">Recent Reviews</div>
        </header>
        <div className="admin-panel-body" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Rating</th>
                <th>Date</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "#8e96b7" }}>
                    No feedback yet.
                  </td>
                </tr>
              )}
              {stats.recent.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="admin-badge brand">
                      {"★".repeat(r.overall_rating)}
                      {"☆".repeat(5 - r.overall_rating)}
                    </span>
                  </td>
                  <td style={{ color: "#8e96b7", fontSize: 12 }}>
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td style={{ maxWidth: 600, whiteSpace: "pre-wrap" }}>
                    {r.comment ?? <em style={{ color: "#5b6280" }}>(no comment)</em>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-label">{label}</div>
      <div className={`admin-stat-value ${accent ? "brand" : ""}`}>{value}</div>
    </div>
  );
}

function DistributionRow({
  stars,
  count,
  percent,
}: {
  stars: number;
  count: number;
  percent: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "62px 1fr 60px",
        alignItems: "center",
        gap: 10,
        fontSize: 12.5,
      }}
    >
      <span style={{ color: "#facc15" }}>
        {"★".repeat(stars)}
        <span style={{ color: "#3a3e58" }}>{"★".repeat(5 - stars)}</span>
      </span>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: "#1c1e2d",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background:
              "linear-gradient(90deg, #E06A3B 0%, #C84F27 100%)",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ color: "#8e96b7", textAlign: "right" }}>
        {percent}% ({count})
      </span>
    </div>
  );
}

function RatedItemList({
  title,
  items,
  accent,
}: {
  title: string;
  items: { name: string; avg: number; count: number }[];
  accent?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          color: "#8e96b7",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "#5b6280" }}>Not enough data yet.</div>
      ) : (
        <table className="admin-table">
          <tbody>
            {items.map((it) => (
              <tr key={it.name}>
                <td>{it.name}</td>
                <td
                  style={{
                    textAlign: "right",
                    color: accent ? "#34d399" : "#f87171",
                    fontWeight: 700,
                  }}
                >
                  ⭐ {fmt(it.avg)} <span style={{ color: "#5b6280", fontWeight: 500 }}>({it.count})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function fmt(n: number) {
  return n > 0 ? n.toFixed(1) : "—";
}
