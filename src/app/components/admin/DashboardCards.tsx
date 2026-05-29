import { DashboardStats } from "@/lib/types/admin";

/**
 * KPI cards + payment analytics + top items + recent orders panels.
 */
export default function DashboardCards({ stats }: { stats: DashboardStats }) {
  return (
    <>
      <div className="admin-stat-grid">
        <Stat label="Today's Revenue" value={`₹${stats.revenueToday}`} accent />
        <Stat label="Online Revenue" value={`₹${stats.onlineRevenue}`} />
        <Stat label="Cash Revenue" value={`₹${stats.cashRevenue}`} />
        <Stat label="Orders Today" value={String(stats.ordersToday)} />
        <Stat label="Active" value={String(stats.activeOrders)} />
        <Stat label="Pending" value={String(stats.pendingOrders)} />
        <Stat label="Paid" value={String(stats.paidOrders)} />
        <Stat label="Unpaid" value={String(stats.unpaidOrders)} />
        <Stat
          label="Average Rating"
          value={stats.totalReviews > 0 ? `⭐ ${stats.averageRating} / 5` : "—"}
          accent
        />
        <Stat label="Total Reviews" value={String(stats.totalReviews)} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: 18,
        }}
        className="admin-dashboard-row"
      >
        <section className="admin-panel">
          <header className="admin-panel-header">
            <div className="admin-panel-title">Top Selling Today</div>
            <span className="admin-badge muted">Live</span>
          </header>
          <div className="admin-panel-body">
            {stats.topItems.length === 0 ? (
              <div style={{ color: "#8e96b7", fontSize: 13 }}>
                No orders yet today.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topItems.map((it) => (
                    <tr key={it.name}>
                      <td>{it.name}</td>
                      <td style={{ textAlign: "right" }}>{it.quantity}</td>
                      <td style={{ textAlign: "right" }}>₹{it.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="admin-panel">
          <header className="admin-panel-header">
            <div className="admin-panel-title">Recent Orders</div>
            <a className="admin-mini-btn" href="/admin/kitchen">
              Open Kitchen →
            </a>
          </header>
          <div className="admin-panel-body">
            {stats.recentOrders.length === 0 ? (
              <div style={{ color: "#8e96b7", fontSize: 13 }}>
                No orders yet.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Table</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <span
                          style={{
                            fontFamily: "monospace",
                            color: "#e06a3b",
                          }}
                        >
                          #{o.short_id}
                        </span>
                      </td>
                      <td>{o.table_number ?? "—"}</td>
                      <td>{o.item_count}</td>
                      <td>
                        <PaymentBadge
                          method={o.payment_method}
                          status={o.payment_status}
                        />
                      </td>
                      <td>
                        <span className={statusBadgeClass(o.status)}>
                          {o.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>₹{o.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-dashboard-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
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

function PaymentBadge({
  method,
  status,
}: {
  method: string | null;
  status: string | null;
}) {
  const methodLabel = (method ?? "—").toUpperCase();
  const statusLabel = (status ?? "").toUpperCase();
  const cls =
    status === "paid"
      ? "admin-badge veg"
      : status === "failed"
        ? "admin-badge nonveg"
        : "admin-badge muted";
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      <span className="admin-badge brand">{methodLabel}</span>
      {statusLabel && <span className={cls}>{statusLabel}</span>}
    </span>
  );
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "completed":
      return "admin-badge muted";
    case "cancelled":
      return "admin-badge nonveg";
    case "pending":
    case "accepted":
    case "preparing":
    case "ready":
      return "admin-badge brand";
    default:
      return "admin-badge muted";
  }
}
