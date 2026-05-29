"use client";

type QRCardProps = {
  tableNumber: number;
  url: string;
  qrDataUrl: string;
  restaurantName: string;
};

/**
 * Single QR card on the admin dashboard.
 *
 *   - Shows table number, QR preview, and target URL
 *   - "Download" button saves the QR PNG with a clean filename
 *   - "Copy URL" button writes the URL to the clipboard
 *
 * The QR image itself is rendered server-side as a data URL, so this
 * component is a thin client wrapper for the interactions.
 */
export default function QRCard({
  tableNumber,
  url,
  qrDataUrl,
  restaurantName,
}: QRCardProps) {
  const filename = `${slugify(restaurantName)}-table-${tableNumber}.png`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers — silently noop is fine for an admin tool.
    }
  };

  return (
    <div className="qr-card">
      <div className="qr-card-header">
        <div className="qr-card-table-num">Table {tableNumber}</div>
        <div className="qr-card-restaurant">{restaurantName}</div>
      </div>

      <div className="qr-card-preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt={`QR code for table ${tableNumber}`} />
      </div>

      <div className="qr-card-url" title={url}>
        {url}
      </div>

      <div className="qr-card-actions">
        <a className="qr-btn qr-btn-primary" href={qrDataUrl} download={filename}>
          ⬇ Download PNG
        </a>
        <button className="qr-btn qr-btn-secondary" onClick={handleCopy}>
          🔗 Copy URL
        </button>
      </div>
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
