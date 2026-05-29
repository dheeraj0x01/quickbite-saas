import "server-only";
import QRCode from "qrcode";

/**
 * QR code generation helpers (server-side).
 *
 * We render the QR to a PNG data URL on the server so the page is fully
 * SEO/print-friendly and the browser doesn't need to load any QR library.
 *
 * Customize colors / size in one place — the look stays consistent across
 * the dashboard, downloads, and any future printable sheets.
 */

const DEFAULT_OPTIONS = {
  // Generous default size for crisp print results when downloaded.
  width: 512,
  margin: 2,
  errorCorrectionLevel: "M" as const,
  color: {
    dark: "#1A1C23", // brand charcoal
    light: "#FFFFFF",
  },
};

/** Generate a base64 PNG data URL for the given URL/value. */
export async function generateQrDataUrl(
  value: string,
  overrides: Partial<typeof DEFAULT_OPTIONS> = {},
): Promise<string> {
  return QRCode.toDataURL(value, { ...DEFAULT_OPTIONS, ...overrides });
}

/**
 * Build the public diner URL for a (slug, tableNumber) pair.
 *
 * `origin` is detected at request time on the server (via the `host` header)
 * so QR codes always carry the correct domain — local dev, preview, or prod.
 */
export function buildTableUrl(
  origin: string,
  slug: string,
  tableNumber: number,
): string {
  // Trim any trailing slash to avoid `//r/...` URLs.
  const normalized = origin.replace(/\/+$/, "");
  return `${normalized}/r/${slug}/t/${tableNumber}`;
}
