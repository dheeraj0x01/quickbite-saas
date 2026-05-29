"use client";

import { Lang, languageDict } from "../data/menuData";

type HeroProps = {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  /** Override values from Supabase. Optional so existing tests still work. */
  restaurantName?: string;
  subtitle?: string;
  rating?: number | null;
  prepTime?: string | null;
  tableNumber?: number;
};

/**
 * Restaurant hero banner with table tag, kitchen status,
 * title, subtitle, quick stats and language selector strip.
 *
 * When `restaurantName`, `subtitle`, `tableNumber` etc. are provided, they
 * override the static translations — making the component restaurant-agnostic
 * for the dynamic /r/[slug]/t/[table] route.
 */
export default function Hero({
  lang,
  onLangChange,
  restaurantName,
  subtitle,
  rating,
  prepTime,
  tableNumber,
}: HeroProps) {
  const t = languageDict[lang];

  const tableLabel =
    typeof tableNumber === "number" ? `🍽 TABLE ${tableNumber}` : t["loc-table"];
  const title = restaurantName ?? t["loc-title"];
  const sub = subtitle ?? t["loc-sub"];
  const ratingLabel = rating != null ? String(rating) : t["loc-rating"];
  const prepLabel = prepTime ?? t["loc-prep"];

  return (
    <>
      <div className="phone-hero">
        <div className="restaurant-meta">
          <div className="table-tag">{tableLabel}</div>
          <div className="live-status">
            <div className="status-pulse"></div>
            <span>{t["loc-kitchen"]}</span>
          </div>
        </div>
        <div className="phone-title">{title}</div>
        <div className="phone-subtitle">{sub}</div>
        <div className="quick-stats">
          <div className="quick-stat">
            ⭐ <span>{ratingLabel}</span> Rating
          </div>
          <div className="quick-stat">
            ⏱ <span>{prepLabel}</span>
          </div>
          <div className="quick-stat">
            🔥 <span>{t["loc-pop"]}</span>
          </div>
        </div>
      </div>

      <div className="language-strip">
        <button
          className={`lang-btn ${lang === "en" ? "active" : ""}`}
          onClick={() => onLangChange("en")}
        >
          English
        </button>
        <button
          className={`lang-btn ${lang === "hi" ? "active" : ""}`}
          onClick={() => onLangChange("hi")}
        >
          हिन्दी
        </button>
        <button
          className={`lang-btn ${lang === "te" ? "active" : ""}`}
          onClick={() => onLangChange("te")}
        >
          తెలుగు
        </button>
      </div>
    </>
  );
}
