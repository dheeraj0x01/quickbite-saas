import "server-only";
import crypto from "node:crypto";

/**
 * Verify the Razorpay payment signature.
 *
 * Razorpay returns three values from the checkout: razorpay_order_id,
 * razorpay_payment_id, and razorpay_signature. The signature is an
 * HMAC-SHA256 of `${order_id}|${payment_id}` using your Key Secret.
 *
 * Always verify server-side. Never trust the browser's "success" callback.
 *
 * Uses a constant-time comparison to avoid timing attacks.
 */
export function verifyRazorpaySignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error("[verifySignature] RAZORPAY_KEY_SECRET is missing");
    return false;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  // Buffers must be equal length for `timingSafeEqual`.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(razorpay_signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
