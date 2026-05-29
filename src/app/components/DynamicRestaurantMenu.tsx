"use client";

import { useMemo, useState } from "react";
import { Lang } from "../data/menuData";
import { MenuItemRow, RestaurantRow } from "@/lib/types/database";
import {
  CreateOrderResult,
  CreateOrderSuccess,
  PaymentMethod,
} from "@/lib/types/order";
import { useCart } from "../hooks/useCart";
import Hero from "./Hero";
import OrderSuccessModal from "./OrderSuccessModal";
import PaymentSelector from "./checkout/PaymentSelector";
import {
  launchRazorpayCheckout,
} from "./checkout/RazorpayCheckout";

type CategoryDescriptor = { id: string; label: string; emoji: string };

type DynamicRestaurantMenuProps = {
  restaurant: RestaurantRow;
  tableNumber: number;
  menuItems: MenuItemRow[];
  categories: CategoryDescriptor[];
};

const TAG_LABEL: Record<string, string> = {
  best: "★ Bestseller",
  spicy: "🌶 Spicy",
  chef: "👨‍🍳 Chef Choice",
};

/**
 * Live, Supabase-backed menu component.
 *
 * Order placement supports two paths:
 *
 *   CASH   →  POST /api/orders directly. Order row is created with
 *             payment_method='cash', payment_status='unpaid'. Kitchen sees
 *             it instantly via realtime.
 *
 *   ONLINE →  POST /api/payments/create-order to mint a Razorpay order →
 *             open Razorpay checkout → on success, POST the signature to
 *             /api/payments/verify which (after server-side signature +
 *             amount validation) actually creates the order. The kitchen
 *             therefore NEVER sees an unpaid online order.
 */
export default function DynamicRestaurantMenu({
  restaurant,
  tableNumber,
  menuItems,
  categories,
}: DynamicRestaurantMenuProps) {
  const [lang, setLang] = useState<Lang>("en");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("online");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] =
    useState<CreateOrderSuccess["order"] | null>(null);

  const { cart, addItem, incrementItem, decrementItem, clear, totals } =
    useCart();

  const itemsById = useMemo(
    () => new Map(menuItems.map((m) => [m.id, m])),
    [menuItems],
  );

  const visibleItems = useMemo(
    () =>
      menuItems.filter(
        (m) => activeCategory === "all" || m.category === activeCategory,
      ),
    [menuItems, activeCategory],
  );

  // --------- CASH order ---------
  const placeCashOrder = async () => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_slug: restaurant.slug,
        table_number: tableNumber,
        items: Object.values(cart).map((line) => ({
          menu_item_id: line.menuItemId,
          quantity: line.qty,
        })),
        payment_method: "cash",
      }),
    });
    const json = (await res.json()) as CreateOrderResult;
    if (!res.ok || !json.ok) {
      throw new Error(
        (json as Exclude<CreateOrderResult, CreateOrderSuccess>).error ??
          "Could not place order.",
      );
    }
    return json.order;
  };

  // --------- ONLINE order ---------
  // Returns the created order on success, OR `null` if the user cancelled
  // the Razorpay modal. `null` is a normal user action — not an error.
  const placeOnlineOrder = async (): Promise<
    CreateOrderSuccess["order"] | null
  > => {
    const itemsPayload = Object.values(cart).map((line) => ({
      menu_item_id: line.menuItemId,
      quantity: line.qty,
    }));

    // 1. Create Razorpay order on the server.
    const createRes = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_slug: restaurant.slug,
        table_number: tableNumber,
        items: itemsPayload,
      }),
    });
    const createJson = await createRes.json();
    if (!createRes.ok || !createJson.ok) {
      throw new Error(createJson.error ?? "Failed to start payment");
    }

    // 2. Open Razorpay checkout. Now returns a discriminated union, never throws.
    const checkout = await launchRazorpayCheckout({
      keyId: createJson.key_id,
      amount: createJson.amount,
      razorpayOrderId: createJson.razorpay_order_id,
      restaurantName: restaurant.name,
      tableNumber,
    });

    if (checkout.status === "cancelled") {
      // Normal user action: caller will show a soft toast and re-enable the
      // Pay button. No order row is created server-side.
      return null;
    }
    if (checkout.status === "failed") {
      throw new Error(checkout.error);
    }

    const { payload } = checkout;

    // 3. Verify on the server — only this step creates the actual order row.
    const verifyRes = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: payload.razorpay_order_id,
        razorpay_payment_id: payload.razorpay_payment_id,
        razorpay_signature: payload.razorpay_signature,
        restaurant_slug: restaurant.slug,
        table_number: tableNumber,
        items: itemsPayload,
      }),
    });
    const verifyJson = (await verifyRes.json()) as CreateOrderResult;
    if (!verifyRes.ok || !verifyJson.ok) {
      throw new Error(
        (verifyJson as Exclude<CreateOrderResult, CreateOrderSuccess>)
          .error ?? "Payment verification failed",
      );
    }
    return verifyJson.order;
  };

  // --------- Place order entrypoint ---------
  const handlePlaceOrder = async () => {
    if (submitting) return;
    if (totals.qty === 0) {
      setSubmitError("Your cart is empty.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      const order =
        payMethod === "online" ? await placeOnlineOrder() : await placeCashOrder();

      // For the online flow, `null` means the user dismissed the Razorpay
      // modal — a normal action, not an error. Show a soft message, keep
      // the cart intact, and re-enable the Pay button so they can retry.
      if (!order) {
        setSubmitError("Payment cancelled. You can try again whenever you're ready.");
        return;
      }

      setConfirmedOrder(order);
      clear();
      setCartOpen(false);
    } catch (err) {
      console.error("[placeOrder]", err);
      setSubmitError(
        err instanceof Error ? err.message : "Could not place order.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="menu-app">
      <div className="menu-content">
        <Hero
          lang={lang}
          onLangChange={setLang}
          restaurantName={restaurant.name}
          subtitle={restaurant.subtitle ?? undefined}
          rating={restaurant.rating}
          prepTime={restaurant.prep_time}
          tableNumber={tableNumber}
        />

        <div className="category-scroll">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`category-pill ${
                activeCategory === cat.id ? "active" : ""
              }`}
              onClick={() => setActiveCategory(cat.id)}
              role="button"
              tabIndex={0}
            >
              <div className="category-emoji-box">{cat.emoji}</div>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>

        <div className="menu-container">
          {renderCards({
            visibleItems,
            categories,
            activeCategory,
            cart,
            onAdd: (item) =>
              addItem({
                menuItemId: item.id,
                name: item.name,
                unitPrice: Number(item.price),
              }),
            onInc: incrementItem,
            onDec: decrementItem,
          })}
        </div>
      </div>

      {/* Floating cart bar */}
      <button
        type="button"
        className={`cart-float-bar ${totals.qty > 0 ? "show" : ""}`}
        onClick={() => setCartOpen(true)}
        aria-label="View cart"
      >
        <div className="cart-float-left">
          <div className="cart-float-count">{totals.qty}</div>
          <div className="cart-float-text">View Cart</div>
        </div>
        <div className="cart-float-amount">
          <span>₹{totals.subtotal}</span>
          <span style={{ fontSize: 11 }}>→</span>
        </div>
      </button>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartLines={Object.values(cart)}
        itemsById={itemsById}
        totals={totals}
        payMethod={payMethod}
        onSelectPay={setPayMethod}
        onIncrement={incrementItem}
        onDecrement={decrementItem}
        onPlaceOrder={handlePlaceOrder}
        submitting={submitting}
        submitError={submitError}
      />

      <OrderSuccessModal
        open={!!confirmedOrder}
        order={confirmedOrder}
        restaurantName={restaurant.name}
        restaurantSlug={restaurant.slug}
        tableNumber={tableNumber}
        onClose={() => setConfirmedOrder(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------
// Inlined helpers
// ---------------------------------------------------------------

/**
 * Render the menu cards.
 *
 * When viewing "all", items are grouped by category and each category
 * heading renders exactly once — even if the underlying `visibleItems`
 * array is not sorted strictly by category. For other category filters,
 * items render flat without headings.
 *
 * Each rendered element gets a stable, unique key:
 *   - heading-<category>      (one per category, never duplicated)
 *   - <item.id>               (UUID from Supabase — globally unique)
 */
function renderCards({
  visibleItems,
  categories,
  activeCategory,
  cart,
  onAdd,
  onInc,
  onDec,
}: {
  visibleItems: MenuItemRow[];
  categories: CategoryDescriptor[];
  activeCategory: string;
  cart: Record<string, { qty: number }>;
  onAdd: (item: MenuItemRow) => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
}) {
  // Flat render when filtered to a single category — no headings needed.
  if (activeCategory !== "all") {
    return visibleItems.map((item) =>
      renderFoodCard({ item, cart, onAdd, onInc, onDec }),
    );
  }

  // Group items by category, preserving the order in which each category
  // first appears in `visibleItems`. This guarantees each heading renders
  // exactly once and matches the existing visual order.
  const groups = new Map<string, MenuItemRow[]>();
  visibleItems.forEach((item) => {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  });

  const blocks: React.ReactNode[] = [];
  groups.forEach((items, category) => {
    const meta = categories.find((c) => c.id === category);
    blocks.push(
      <div key={`heading-${category}`} className="menu-heading">
        {meta?.label ?? category}
      </div>,
    );
    items.forEach((item) => {
      blocks.push(renderFoodCard({ item, cart, onAdd, onInc, onDec }));
    });
  });
  return blocks;
}

/**
 * Render a single food card. Pulled out of `renderCards` so it can be
 * reused in the grouped and flat code paths.
 */
function renderFoodCard({
  item,
  cart,
  onAdd,
  onInc,
  onDec,
}: {
  item: MenuItemRow;
  cart: Record<string, { qty: number }>;
  onAdd: (item: MenuItemRow) => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
}) {
  const qtyInCart = cart[item.id]?.qty ?? 0;
  const inStock = item.in_stock;

  return (
    <div
      className={`food-card ${!inStock ? "out-of-stock" : ""}`}
      key={item.id}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="food-img" src={item.image_url ?? ""} alt={item.name} />
      <div className="food-info">
        <div className="food-title-row">
          <div className="food-title">{item.name}</div>
          <div className={`diet-dot ${item.veg ? "veg" : "nonveg"}`}></div>
        </div>

        {item.tags.length > 0 && (
          <div className="food-tags">
            {item.tags.map((tag) => (
              <span className={`tag-badge ${tag}`} key={tag}>
                {TAG_LABEL[tag] ?? tag}
              </span>
            ))}
          </div>
        )}

        <div className="food-desc">{item.description ?? ""}</div>

        <div className="food-bottom-row">
          <div className="food-price">
            ₹{Number(item.price)}
            <span>/ portion</span>
          </div>
          <div>
            {!inStock ? (
              <button className="add-only-btn" disabled>
                Sold Out
              </button>
            ) : qtyInCart === 0 ? (
              <button className="add-only-btn" onClick={() => onAdd(item)}>
                + ADD
              </button>
            ) : (
              <div className="add-btn-wrapper">
                <button onClick={() => onDec(item.id)}>−</button>
                <div className="add-btn-qty">{qtyInCart}</div>
                <button onClick={() => onInc(item.id)}>+</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  open,
  onClose,
  cartLines,
  itemsById,
  totals,
  payMethod,
  onSelectPay,
  onIncrement,
  onDecrement,
  onPlaceOrder,
  submitting,
  submitError,
}: {
  open: boolean;
  onClose: () => void;
  cartLines: Array<{
    menuItemId: string;
    name: string;
    unitPrice: number;
    qty: number;
  }>;
  itemsById: Map<string, MenuItemRow>;
  totals: { qty: number; subtotal: number; gst: number; grandTotal: number };
  payMethod: PaymentMethod;
  onSelectPay: (m: PaymentMethod) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onPlaceOrder: () => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  const buttonLabel = submitting
    ? payMethod === "online"
      ? "OPENING PAYMENT…"
      : "PLACING ORDER…"
    : payMethod === "online"
      ? "PAY & PLACE ORDER"
      : "PLACE ORDER";

  return (
    <div
      className={`checkout-drawer ${open ? "show" : ""}`}
      onClick={handleBackdropClick}
    >
      <div className="checkout-modal">
        <div className="checkout-title">
          <span>Your Order 🛒</span>
          <button
            className="cust-close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        <div className="checkout-items-list">
          {cartLines.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "#7A8090",
                padding: "12px 0",
                fontSize: 13,
              }}
            >
              Your cart is empty.
            </div>
          )}
          {cartLines.map((line) => {
            const item = itemsById.get(line.menuItemId);
            return (
              <div className="checkout-item-row" key={line.menuItemId}>
                <div className="checkout-item-details">
                  <div className="checkout-item-title">
                    {line.qty} × {item?.name ?? line.name}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="add-btn-wrapper">
                    <button onClick={() => onDecrement(line.menuItemId)}>
                      −
                    </button>
                    <div className="add-btn-qty">{line.qty}</div>
                    <button onClick={() => onIncrement(line.menuItemId)}>
                      +
                    </button>
                  </div>
                  <div className="checkout-item-price">
                    ₹{line.unitPrice * line.qty}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bill-row">
          <span>Subtotal</span>
          <span>₹{totals.subtotal}</span>
        </div>
        <div className="bill-row">
          <span>GST & Service tax (5%)</span>
          <span>₹{totals.gst}</span>
        </div>
        <div className="bill-row total">
          <span>Grand Total</span>
          <span>₹{totals.grandTotal}</span>
        </div>

        <div className="cust-section-title" style={{ marginTop: 20 }}>
          PAYMENT METHOD
        </div>
        <PaymentSelector
          value={payMethod}
          onChange={onSelectPay}
          disabled={submitting}
        />

        {submitError && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 10,
              background: "#FEE2E2",
              color: "#991B1B",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {submitError}
          </div>
        )}

        <button
          className="place-order-submit"
          onClick={onPlaceOrder}
          disabled={submitting || cartLines.length === 0}
          style={{
            opacity: submitting || cartLines.length === 0 ? 0.7 : 1,
            cursor:
              submitting || cartLines.length === 0
                ? "not-allowed"
                : "pointer",
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
