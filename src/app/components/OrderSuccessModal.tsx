"use client";

import { CreateOrderSuccess } from "@/lib/types/order";
import FeedbackCard from "./feedback/FeedbackCard";
import "../styles/feedback.css";

type OrderSuccessModalProps = {
  open: boolean;
  order: CreateOrderSuccess["order"] | null;
  restaurantName: string;
  /** Restaurant slug + table number — needed for the inline feedback card. */
  restaurantSlug?: string;
  tableNumber?: number;
  onClose: () => void;
};

/**
 * Premium success modal shown after a successful order placement.
 * Reuses the existing checkout-drawer styling for visual consistency.
 *
 * Now also renders the inline customer feedback card so diners can rate
 * the meal without leaving the success surface. Submission is optional;
 * dismissing the modal works as before.
 */
export default function OrderSuccessModal({
  open,
  order,
  restaurantName,
  restaurantSlug,
  tableNumber,
  onClose,
}: OrderSuccessModalProps) {
  if (!open || !order) return null;

  // Short, human-friendly order id (last 6 chars of UUID).
  const shortId = order.id.replace(/-/g, "").slice(-6).toUpperCase();
  const slug = restaurantSlug ?? "";
  const table = tableNumber ?? order.table_number;

  return (
    <div className="checkout-drawer show" onClick={onClose}>
      <div
        className="checkout-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ textAlign: "center" }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#E6F8F3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "8px auto 12px",
            fontSize: 36,
          }}
        >
          🎉
        </div>

        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#1A1C23",
          }}
        >
          Order Confirmed!
        </div>
        <div style={{ fontSize: 12, color: "#7A8090", marginTop: 4 }}>
          {restaurantName} • Table {order.table_number}
        </div>

        <div
          style={{
            background: "#F8F9FA",
            border: "1px dashed #E5E7EB",
            borderRadius: 12,
            padding: "12px 16px",
            margin: "20px 0",
          }}
        >
          <div style={{ fontSize: 11, color: "#7A8090", letterSpacing: 1 }}>
            ORDER ID
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#E06A3B",
              letterSpacing: 2,
              marginTop: 2,
            }}
          >
            #{shortId}
          </div>
        </div>

        <div style={{ textAlign: "left", marginBottom: 16 }}>
          {order.items.map((item) => (
            <div className="checkout-item-row" key={item.menu_item_id}>
              <div className="checkout-item-details">
                <div className="checkout-item-title">
                  {item.quantity} × {item.name}
                </div>
              </div>
              <div className="checkout-item-price">₹{item.line_total}</div>
            </div>
          ))}
        </div>

        <div className="bill-row">
          <span>Subtotal</span>
          <span>₹{order.subtotal}</span>
        </div>
        <div className="bill-row">
          <span>GST & Service tax (5%)</span>
          <span>₹{order.gst}</span>
        </div>
        <div className="bill-row total">
          <span>Total Paid</span>
          <span>₹{order.total}</span>
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#7A8090",
            marginTop: 16,
            lineHeight: 1.5,
          }}
        >
          Your order has been sent to the kitchen. Please stay seated, the
          team will serve it to your table shortly.
        </div>

        {/* Inline feedback card — optional. */}
        {slug && (
          <FeedbackCard
            restaurantSlug={slug}
            tableNumber={table}
            orderId={order.id}
          />
        )}

        <button
          className="place-order-submit"
          onClick={onClose}
          style={{ background: "#1A1C23" }}
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
