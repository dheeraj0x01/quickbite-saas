"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Lightweight cart state hook.
 *
 * Cart entries are keyed by `menu_item_id` (UUID from Supabase) — the same
 * identifier used by the API. Each line tracks qty, the unit price snapshot
 * (so totals stay stable while the user edits the cart), and lightweight
 * customization options carried over from the existing UI.
 */

export type CartLine = {
  menuItemId: string;
  name: string;
  unitPrice: number;
  qty: number;
  options?: {
    spice?: string;
    addOns?: string[];
    comment?: string;
  };
};

export type Cart = Record<string, CartLine>;

export function useCart() {
  const [cart, setCart] = useState<Cart>({});

  const addItem = useCallback(
    (line: Omit<CartLine, "qty"> & { qty?: number }) => {
      setCart((prev) => {
        const existing = prev[line.menuItemId];
        const inc = line.qty ?? 1;
        const next: CartLine = existing
          ? { ...existing, qty: existing.qty + inc }
          : {
              menuItemId: line.menuItemId,
              name: line.name,
              unitPrice: line.unitPrice,
              qty: inc,
              options: line.options,
            };
        return { ...prev, [line.menuItemId]: next };
      });
    },
    [],
  );

  const incrementItem = useCallback((id: string) => {
    setCart((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      return { ...prev, [id]: { ...existing, qty: existing.qty + 1 } };
    });
  }, []);

  const decrementItem = useCallback((id: string) => {
    setCart((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      const nextQty = existing.qty - 1;
      const next = { ...prev };
      if (nextQty <= 0) delete next[id];
      else next[id] = { ...existing, qty: nextQty };
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clear = useCallback(() => setCart({}), []);

  const totals = useMemo(() => {
    let qty = 0;
    let subtotal = 0;
    for (const line of Object.values(cart)) {
      qty += line.qty;
      subtotal += line.qty * line.unitPrice;
    }
    const gst = Math.round(subtotal * 0.05);
    return { qty, subtotal, gst, grandTotal: subtotal + gst };
  }, [cart]);

  return {
    cart,
    addItem,
    incrementItem,
    decrementItem,
    removeItem,
    clear,
    totals,
  };
}
