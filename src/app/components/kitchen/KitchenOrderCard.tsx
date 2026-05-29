"use client";

import { memo, useState } from "react";
import {
  KitchenOrder,
  OrderStatus,
  STATUS_NEXT_ACTIONS,
} from "@/lib/types/kitchen";
import KitchenStatusBadge from "./KitchenStatusBadge";

type KitchenOrderCardProps = {
  order: KitchenOrder;
  onChangeStatus: (orderId: string, next: OrderStatus) => Promise<void> | void;
};

/**
 * One order card in the kitchen grid.
 *
 *   - Shows short id, table tag, items, totals, payment, age
 *   - Action buttons reflect the legal next states for the current status
 *   - Buttons disable themselves while a transition is in flight
 *
 * Memoized so unrelated state changes (e.g. another order updating)
 * don't re-render every card in the grid.
 */
function KitchenOrderCard({
  order,
  onChangeStatus,
}: KitchenOrderCardProps) {
  const [pending, setPending] = useState<OrderStatus | null>(null);
  const shortId = order.id.replace(/-/g, "").slice(-6).toUpperCase();
  const nextActions = STATUS_NEXT_ACTIONS[order.status] ?? [];

  const handle = async (next: OrderStatus) => {
    if (pending) return;
    setPending(next);
    try {
      await onChangeStatus(order.id, next);
    } finally {
      setPending(null);
    }
  };

  return (
    <article className="kds-card">
      <header className="kds-card-header">
        <div>
          <div className="kds-card-id">#{shortId}</div>
          <div className="kds-table-tag">
            🍽 Table{" "}
            {order.table_number != null ? order.table_number : "—"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <KitchenStatusBadge status={order.status} />
          <div className="kds-card-time" style={{ marginTop: 6 }}>
            {formatAgo(order.created_at)}
          </div>
        </div>
      </header>

      <div className="kds-card-body">
        <ul className="kds-items-list">
          {order.items.length === 0 && (
            <li className="kds-item-row">
              <span className="kds-item-name" style={{ color: "#8e96b7" }}>
                Loading items…
              </span>
            </li>
          )}
          {order.items.map((it) => (
            <li className="kds-item-row" key={it.id}>
              <span className="kds-item-name">
                <span className="kds-item-qty">×{it.quantity}</span>
                {it.name}
              </span>
              <span className="kds-item-price">
                ₹{Number(it.price) * it.quantity}
              </span>
            </li>
          ))}
        </ul>

        <div className="kds-bill">
          <div className="kds-bill-row">
            <span>Subtotal</span>
            <span>₹{order.subtotal}</span>
          </div>
          <div className="kds-bill-row">
            <span>GST (5%)</span>
            <span>₹{order.gst}</span>
          </div>
          <div className="kds-bill-row total">
            <span>Total</span>
            <span>₹{order.total}</span>
          </div>
          <div className="kds-bill-pay">
            Payment:{" "}
            <span>{(order.payment_method ?? "—").toUpperCase()}</span>
            {order.payment_status && (
              <>
                {" "}
                •{" "}
                <span
                  className={`kds-pay-status kds-pay-${order.payment_status}`}
                >
                  {order.payment_status.toUpperCase()}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {nextActions.length > 0 && (
        <footer className="kds-card-actions">
          {nextActions.map((a) => (
            <button
              key={a.next}
              className={`kds-action ${actionClass(a.next)}`}
              disabled={pending !== null}
              onClick={() => handle(a.next)}
            >
              {pending === a.next ? "…" : a.label}
            </button>
          ))}
        </footer>
      )}
    </article>
  );
}

function actionClass(next: OrderStatus) {
  switch (next) {
    case "accepted":
    case "preparing":
      return "kds-action-primary";
    case "ready":
    case "completed":
      return "kds-action-success";
    case "cancelled":
      return "kds-action-danger";
    default:
      return "";
  }
}

function formatAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

export default memo(KitchenOrderCard);
