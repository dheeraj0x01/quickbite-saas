import { OrderStatus } from "@/lib/types/kitchen";

const LABEL: Record<OrderStatus, string> = {
  pending: "PENDING",
  accepted: "ACCEPTED",
  preparing: "PREPARING",
  ready: "READY",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
};

const ICON: Record<OrderStatus, string> = {
  pending: "⏳",
  accepted: "✅",
  preparing: "🍳",
  ready: "🛎️",
  completed: "✓",
  cancelled: "✕",
};

/**
 * Color-coded status pill used inside each kitchen order card.
 */
export default function KitchenStatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  return (
    <span className={`kds-status-badge kds-status-${status}`}>
      <span>{ICON[status]}</span>
      {LABEL[status]}
    </span>
  );
}
