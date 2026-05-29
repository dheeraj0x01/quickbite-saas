"use client";

import { useMemo, useState } from "react";
import {
  KitchenOrder,
  OrderStatus,
  STATUS_SORT_PRIORITY,
} from "@/lib/types/kitchen";
import { useRealtimeOrders } from "@/app/hooks/useRealtimeOrders";
import KitchenHeader from "./KitchenHeader";
import KitchenOrderCard from "./KitchenOrderCard";

type Tab = "all" | "active" | OrderStatus;

type KitchenBoardProps = {
  restaurantId: string;
  restaurantName: string;
  initialOrders: KitchenOrder[];
};

const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
];

/**
 * Client-side container that owns:
 *  - Realtime subscription via `useRealtimeOrders`
 *  - The active filter tab
 *  - Optimistic status updates + API call
 *
 * The Server Component (page.tsx) hands us the initial snapshot so the
 * page is interactive and populated on first paint, before the realtime
 * channel is even connected.
 */
export default function KitchenBoard({
  restaurantId,
  restaurantName,
  initialOrders,
}: KitchenBoardProps) {
  const { orders, setStatusLocal } = useRealtimeOrders(
    restaurantId,
    initialOrders,
  );
  const [tab, setTab] = useState<Tab>("active");

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const ap = STATUS_SORT_PRIORITY[a.status] ?? 99;
      const bp = STATUS_SORT_PRIORITY[b.status] ?? 99;
      if (ap !== bp) return ap - bp;
      // Newest first within the same status bucket.
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [orders]);

  const counts: Record<Tab, number> = useMemo(() => {
    const base: Record<Tab, number> = {
      all: orders.length,
      active: 0,
      pending: 0,
      accepted: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      base[o.status] += 1;
      if (ACTIVE_STATUSES.includes(o.status)) base.active += 1;
    }
    return base;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    if (tab === "all") return sortedOrders;
    if (tab === "active")
      return sortedOrders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    return sortedOrders.filter((o) => o.status === tab);
  }, [sortedOrders, tab]);

  const handleChangeStatus = async (
    orderId: string,
    next: OrderStatus,
  ): Promise<void> => {
    // Optimistic update so the kitchen UI feels instant.
    setStatusLocal(orderId, next);
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      // Realtime UPDATE event will reconcile the row if anything diverges.
    } catch (err) {
      console.error("[kitchen] status update failed:", err);
    }
  };

  return (
    <main className="kds-page">
      <div className="kds-page-inner">
        <KitchenHeader
          restaurantName={restaurantName}
          totalOrders={orders.length}
          activeTab={tab}
          onTabChange={setTab}
          counts={counts}
        />

        {visibleOrders.length === 0 ? (
          <div className="kds-empty">
            🛋 No {tab === "all" ? "" : tab} orders right now.
            <br />
            Place an order from a customer table to see it appear instantly.
          </div>
        ) : (
          <div className="kds-grid">
            {visibleOrders.map((o) => (
              <KitchenOrderCard
                key={o.id}
                order={o}
                onChangeStatus={handleChangeStatus}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
