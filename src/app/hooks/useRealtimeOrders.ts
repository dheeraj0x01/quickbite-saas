"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { KitchenOrder, OrderStatus } from "@/lib/types/kitchen";

/**
 * Live kitchen orders hook.
 *
 * Workflow:
 *   1. Seed state with the initial list passed by the Server Component.
 *   2. Subscribe to Supabase Realtime on `orders` (INSERT + UPDATE)
 *      and on `order_items` (INSERT).
 *   3. On INSERT into `orders`, hydrate the new row by calling
 *      /api/kitchen/orders/:id (server-side, joins items + table).
 *      This avoids a flash of "Unknown" item names while items arrive.
 *   4. On UPDATE into `orders`, patch the matching local row.
 *   5. On INSERT into `order_items`, append it to the matching order
 *      (covers race conditions where items arrive after the order row).
 *
 * The component using this hook also gets a `refresh()` function for
 * manual reloads (e.g. on focus regain).
 */
export function useRealtimeOrders(
  restaurantId: string,
  initial: KitchenOrder[],
) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initial);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Helper: fetch a single fully-hydrated order from our API.
  const hydrateOrder = useCallback(
    async (orderId: string): Promise<KitchenOrder | null> => {
      try {
        const res = await fetch(`/api/kitchen/orders/${orderId}`, {
          cache: "no-store",
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { order?: KitchenOrder };
        return json.order ?? null;
      } catch {
        return null;
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/kitchen/orders?restaurantId=${restaurantId}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const json = (await res.json()) as { orders?: KitchenOrder[] };
      if (json.orders) setOrders(json.orders);
    } catch {
      /* ignore */
    }
  }, [restaurantId]);

  useEffect(() => {
    // Build a unique channel per restaurant so multiple kitchens don't
    // step on each other if you ever multi-tenant the dashboard.
    const channel = supabase
      .channel(`kitchen-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          const newId = (payload.new as { id?: string })?.id;
          if (!newId) return;
          const hydrated = await hydrateOrder(newId);
          if (!hydrated) return;
          setOrders((prev) => {
            // Avoid duplicates if the row already exists (race with refresh).
            if (prev.some((o) => o.id === hydrated.id)) return prev;
            return [hydrated, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const next = payload.new as {
            id: string;
            status?: OrderStatus;
            subtotal?: number;
            gst?: number;
            total?: number;
            payment_method?: string | null;
            payment_status?: string | null;
          };
          if (!next?.id) return;
          setOrders((prev) =>
            prev.map((o) =>
              o.id === next.id
                ? {
                    ...o,
                    status: (next.status ?? o.status) as OrderStatus,
                    subtotal: Number(next.subtotal ?? o.subtotal),
                    gst: Number(next.gst ?? o.gst),
                    total: Number(next.total ?? o.total),
                    payment_method: next.payment_method ?? o.payment_method,
                    payment_status: next.payment_status ?? o.payment_status,
                  }
                : o,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_items",
        },
        async (payload) => {
          const orderId = (payload.new as { order_id?: string })?.order_id;
          if (!orderId) return;
          // Re-hydrate the parent order to get the menu_item name.
          const hydrated = await hydrateOrder(orderId);
          if (!hydrated) return;
          setOrders((prev) => {
            const idx = prev.findIndex((o) => o.id === hydrated.id);
            if (idx === -1) return [hydrated, ...prev];
            const next = [...prev];
            next[idx] = hydrated;
            return next;
          });
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [restaurantId, hydrateOrder]);

  /** Optimistically update an order's status before realtime confirms. */
  const setStatusLocal = useCallback(
    (orderId: string, status: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    },
    [],
  );

  return { orders, refresh, setStatusLocal };
}
