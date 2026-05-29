import { headers } from "next/headers";
import "../../styles/admin-qr.css";
import {
  getRestaurantBySlug,
  getTablesByRestaurant,
} from "@/lib/queries/restaurants";
import { buildTableUrl, generateQrDataUrl } from "@/lib/qr/generate";
import QRCard from "@/app/components/QRCard";
import QRToolbar from "@/app/components/QRToolbar";
import { requirePageRole } from "@/lib/auth/requireRole";

/**
 * Admin QR Dashboard
 *
 *   GET /admin/qr            (defaults to ?slug=spice-garden)
 *   GET /admin/qr?slug=...   (works for any restaurant in Supabase)
 *
 * - Server Component: Supabase + QR generation run on the server.
 * - Origin is detected from request headers so QR codes always carry the
 *   correct domain (localhost, preview deploy, or production).
 * - Layout: responsive grid, mobile-first, print-friendly.
 */

export const dynamic = "force-dynamic";

const DEFAULT_SLUG = "spice-garden";

type SearchParams = Promise<{ slug?: string }>;

async function detectOrigin(): Promise<string> {
  const h = await headers();
  // Prefer the standard forwarded-host headers (Vercel, proxies).
  const host =
    h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function AdminQRPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePageRole(["owner", "manager"], "/admin/qr");
  const { slug = DEFAULT_SLUG } = await searchParams;

  const restaurant = await getRestaurantBySlug(slug);
  const origin = await detectOrigin();

  if (!restaurant) {
    return (
      <main className="qr-page">
        <div className="qr-page-inner">
          <header className="qr-page-header">
            <div>
              <h1 className="qr-page-title">QR Codes</h1>
              <div className="qr-page-subtitle">
                Restaurant table QR management
              </div>
            </div>
          </header>
          <div className="qr-empty">
            No restaurant found with slug{" "}
            <code style={{ color: "#e06a3b" }}>{slug}</code>. Run the seed
            script to create the demo restaurant, then refresh.
          </div>
        </div>
      </main>
    );
  }

  const tables = await getTablesByRestaurant(restaurant.id);

  // Generate every QR data URL in parallel.
  const cards = await Promise.all(
    tables.map(async (t) => {
      const url = buildTableUrl(origin, restaurant.slug, t.table_number);
      const qrDataUrl = await generateQrDataUrl(url);
      return {
        id: t.id,
        tableNumber: t.table_number,
        url,
        qrDataUrl,
      };
    }),
  );

  return (
    <main className="qr-page">
      <div className="qr-page-inner">
        <header className="qr-page-header">
          <div>
            <h1 className="qr-page-title">QR Codes</h1>
            <div className="qr-page-subtitle">
              Print or download QR posters for each table
            </div>
            <div className="qr-page-meta" style={{ marginTop: 12 }}>
              <span className="qr-page-pill brand">
                🏷 {restaurant.name}
              </span>
              <span className="qr-page-pill">
                {tables.length} {tables.length === 1 ? "table" : "tables"}
              </span>
              <span className="qr-page-pill">🌐 {origin}</span>
            </div>
          </div>
          <QRToolbar />
        </header>

        {cards.length === 0 ? (
          <div className="qr-empty">
            No tables configured yet. Add rows to{" "}
            <code>restaurant_tables</code> for{" "}
            <strong>{restaurant.name}</strong>.
          </div>
        ) : (
          <div className="qr-grid">
            {cards.map((c) => (
              <QRCard
                key={c.id}
                tableNumber={c.tableNumber}
                url={c.url}
                qrDataUrl={c.qrDataUrl}
                restaurantName={restaurant.name}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
