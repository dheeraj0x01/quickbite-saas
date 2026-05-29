"use client";

import { OrderStatus } from "@/lib/types/kitchen";

type Tab = "all" | "active" | OrderStatus;

type KitchenHeaderProps = {
  restaurantName: string;
  totalOrders: number;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  counts: Record<Tab, number>;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

/**
 * Top header for the kitchen dashboard: brand mark, restaurant name,
 * live indicator, and the status filter tabs underneath.
 */
export default function KitchenHeader({
  restaurantName,
  totalOrders,
  activeTab,
  onTabChange,
  counts,
}: KitchenHeaderProps) {
  return (
    <>
      <div className="kds-header">
        <div className="kds-title">
          <div className="kds-title-icon">👨‍🍳</div>
          <div className="kds-title-text">
            Kitchen Display System
            <div className="kds-title-sub">{restaurantName} • Live Feed</div>
          </div>
        </div>

        <div className="kds-header-meta">
          <span className="kds-pill kds-live-pill">
            <span className="kds-live-dot"></span> LIVE
          </span>
          <span className="kds-pill">
            🧾 {totalOrders} order{totalOrders === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="kds-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`kds-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
            <span className="kds-tab-count">{counts[tab.id] ?? 0}</span>
          </button>
        ))}
      </div>
    </>
  );
}
