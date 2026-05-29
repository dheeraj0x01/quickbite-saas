"use client";

/**
 * Lightweight Razorpay Checkout launcher.
 *
 * Loads the Razorpay JS SDK once on demand, then opens the modal with
 * the server-provided order id + amount. Returns a discriminated union:
 *
 *   { status: "success", ... }    payment captured by Razorpay
 *   { status: "cancelled" }       user closed/escaped/dismissed the modal
 *   { status: "failed", error }   payment attempt failed on Razorpay side
 *
 * The caller handles each case explicitly. Cancellation is a normal user
 * action, not an exception — this prevents the Next.js dev overlay from
 * firing on a perfectly valid "user changed their mind" flow.
 *
 * Payment-method ordering preference (top-of-modal -> bottom):
 *     1. UPI         (most popular for in-restaurant ordering in India)
 *     2. Card
 *     3. Netbanking
 *     4. Wallet
 */

type RazorpayWindow = {
  Razorpay?: new (options: Record<string, unknown>) => {
    open: () => void;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
  };
};

declare const window: Window & RazorpayWindow;

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject("Not a browser");
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export type LaunchRazorpayParams = {
  keyId: string;
  amount: number; // paise
  razorpayOrderId: string;
  restaurantName: string;
  tableNumber: number;
  prefill?: { name?: string; email?: string; contact?: string };
};

export type RazorpaySuccessPayload = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type LaunchRazorpayResult =
  | { status: "success"; payload: RazorpaySuccessPayload }
  | { status: "cancelled" }
  | { status: "failed"; error: string };

export async function launchRazorpayCheckout(
  params: LaunchRazorpayParams,
): Promise<LaunchRazorpayResult> {
  await loadRazorpayScript();
  if (!window.Razorpay) {
    return { status: "failed", error: "Razorpay SDK unavailable" };
  }

  return new Promise<LaunchRazorpayResult>((resolve) => {
    // `settled` guards against both `handler` and `ondismiss` firing for the
    // same checkout (it can happen on slow networks/edge cases). First one
    // wins; subsequent calls are ignored.
    let settled = false;
    const finish = (result: LaunchRazorpayResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const rzp = new window.Razorpay!({
      key: params.keyId,
      amount: params.amount,
      currency: "INR",
      name: params.restaurantName,
      description: `Table ${params.tableNumber} order`,
      order_id: params.razorpayOrderId,
      image: "https://checkout.razorpay.com/v1/checkout-frame/icon.png",

      prefill: {
        name: params.prefill?.name ?? "",
        email: params.prefill?.email ?? "",
        contact: params.prefill?.contact ?? "",
      },

      readonly: { contact: false, email: false },
      remember_customer: true,

      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
        emi: false,
        paylater: false,
      },

      config: {
        display: {
          blocks: {
            upi_block: {
              name: "Pay using UPI",
              instruments: [{ method: "upi" }],
            },
            other_block: {
              name: "Other Payment Methods",
              instruments: [
                { method: "card" },
                { method: "netbanking" },
                { method: "wallet" },
              ],
            },
          },
          sequence: ["block.upi_block", "block.other_block"],
          preferences: { show_default_blocks: false },
        },
      },

      notes: {
        table_number: String(params.tableNumber),
        restaurant: params.restaurantName,
      },

      theme: { color: "#E06A3B" },

      handler: (response: RazorpaySuccessPayload) =>
        finish({ status: "success", payload: response }),

      modal: {
        // X click, ESC press, browser back, programmatic close — all routed here.
        ondismiss: () => finish({ status: "cancelled" }),
        // Ask the user to confirm before closing if they tap "X" mid-payment.
        confirm_close: true,
        escape: true,
      },
    });

    rzp.on("payment.failed", (...args: unknown[]) => {
      const resp = args[0] as { error?: { description?: string } };
      finish({
        status: "failed",
        error: resp?.error?.description ?? "Payment failed",
      });
    });

    rzp.open();
  });
}
