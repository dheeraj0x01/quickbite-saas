import "server-only";
import Razorpay from "razorpay";

/**
 * Razorpay client (server-only).
 *
 * Lazy-initialized so `next build` can run without the keys present.
 * Throws a helpful error the first time it's used if env vars are missing.
 */

let _client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (_client) return _client;
  const key_id = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error(
      "Missing Razorpay env vars. Set NEXT_PUBLIC_RAZORPAY_KEY_ID and " +
        "RAZORPAY_KEY_SECRET in .env.local, then restart `npm run dev`.",
    );
  }
  _client = new Razorpay({ key_id, key_secret });
  return _client;
}

/** Public key id, safe to ship to the browser (used by the Razorpay checkout JS). */
export function getPublicRazorpayKey(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
}
