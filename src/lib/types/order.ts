/**
 * Order-related shared types.
 * The shapes in this file are the contract between the client cart UI and
 * the `/api/orders` route. Keep them in sync with `src/lib/orders/createOrder.ts`.
 */

export type PaymentMethod = "cash" | "online";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";

/** A single line item submitted with an order. */
export type CartItemPayload = {
  menu_item_id: string;
  quantity: number;
};

/** Payload accepted by POST /api/orders. */
export type CreateOrderPayload = {
  restaurant_slug: string;
  table_number: number;
  items: CartItemPayload[];
  /**
   * The total the client computed (in rupees). It's only used as a sanity
   * check — the server always recalculates the authoritative total from
   * `menu_items.price` to prevent tampering.
   */
  client_total?: number;
  /**
   * "cash" → create immediately, payment_status = unpaid (paid at counter).
   * "online" → must arrive with `payment` set, status = paid.
   * "upi" is accepted as a synonym for "online" (legacy).
   */
  payment_method?: PaymentMethod | "upi";
  /**
   * Present only for online orders. Set by the verify endpoint after
   * Razorpay signature has been validated server-side.
   */
  payment?: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    expected_amount_paise: number;
  };
};

export type OrderItemSnapshot = {
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type CreateOrderSuccess = {
  ok: true;
  order: {
    id: string;
    restaurant_id: string;
    table_id: string;
    table_number: number;
    status: string;
    subtotal: number;
    gst: number;
    total: number;
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    items: OrderItemSnapshot[];
    created_at: string;
  };
};

export type CreateOrderError = {
  ok: false;
  error: string;
  code:
    | "INVALID_PAYLOAD"
    | "RESTAURANT_NOT_FOUND"
    | "TABLE_NOT_FOUND"
    | "EMPTY_CART"
    | "MENU_ITEM_NOT_FOUND"
    | "OUT_OF_STOCK"
    | "AMOUNT_MISMATCH"
    | "DB_INSERT_FAILED";
};

export type CreateOrderResult = CreateOrderSuccess | CreateOrderError;
