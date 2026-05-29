"use client";

import { PaymentMethod } from "@/lib/types/order";

type PaymentSelectorProps = {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
};

/**
 * Reusable payment-method selector for the customer cart drawer.
 * Visual style mirrors the existing `.pay-btn` design so it slots in
 * without any layout changes.
 */
export default function PaymentSelector({
  value,
  onChange,
  disabled,
}: PaymentSelectorProps) {
  return (
    <div className="pay-methods">
      <div
        className={`pay-btn ${value === "online" ? "active" : ""}`}
        onClick={() => !disabled && onChange("online")}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
      >
        <span>📱</span> Pay Online
      </div>
      <div
        className={`pay-btn ${value === "cash" ? "active" : ""}`}
        onClick={() => !disabled && onChange("cash")}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
      >
        <span>💵</span> Pay at Restaurant
      </div>
    </div>
  );
}
