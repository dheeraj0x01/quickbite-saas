"use client";

/**
 * Admin QR dashboard toolbar (client) — currently exposes a single
 * "Print all" action that triggers the browser print dialog. The
 * print stylesheet hides headers/buttons so output is clean.
 */
export default function QRToolbar() {
  return (
    <div className="qr-toolbar">
      <button
        className="qr-toolbar-btn"
        onClick={() => window.print()}
        type="button"
      >
        🖨 Print All
      </button>
    </div>
  );
}
