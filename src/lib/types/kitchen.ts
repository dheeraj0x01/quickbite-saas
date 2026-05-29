/**
 * Kitchen / KDS shared types.
 *
 * `KitchenOrder` is a denormalized, ready-for-display view of an order
 * + its line items + the table number. The kitchen page composes this
 * shape from Supabase joins so the UI doesn't need to do any lookups.
 */

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type KitchenOrderItem = {
  id: string;
  menu_item_id: string | null;
  name: string;
  quantity: number;
  price: number;
};

export type KitchenOrder = {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  table_number: number | null;
  status: OrderStatus;
  subtotal: number;
  gst: number;
  total: number;
  payment_method: string | null;
  payment_status: string | null;
  created_at: string;
  items: KitchenOrderItem[];
};

/**
 * Status transitions allowed in the UI. Used by the action buttons to
 * decide which next-states to expose for a given current status.
 */
export const STATUS_NEXT_ACTIONS: Record<
  OrderStatus,
  { label: string; next: OrderStatus }[]
> = {
  pending: [
    { label: "Accept", next: "accepted" },
    { label: "Cancel", next: "cancelled" },
  ],
  accepted: [
    { label: "Start Preparing", next: "preparing" },
    { label: "Cancel", next: "cancelled" },
  ],
  preparing: [{ label: "Mark Ready", next: "ready" }],
  ready: [{ label: "Mark Completed", next: "completed" }],
  completed: [],
  cancelled: [],
};

/**
 * Sort order priority for the kitchen view:
 *   1. pending (highest)
 *   2. accepted
 *   3. preparing
 *   4. ready
 *   5. completed / cancelled (bottom)
 * Within the same status, newest orders come first.
 */
export const STATUS_SORT_PRIORITY: Record<OrderStatus, number> = {
  pending: 0,
  accepted: 1,
  preparing: 2,
  ready: 3,
  completed: 4,
  cancelled: 5,
};
