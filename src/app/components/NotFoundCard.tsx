type NotFoundCardProps = {
  emoji: string;
  title: string;
  description: string;
};

/**
 * Clean centered card for "Restaurant Not Found" / "Invalid Table" states.
 * Uses inline styles so it stands alone without depending on the menu CSS.
 */
export default function NotFoundCard({
  emoji,
  title,
  description,
}: NotFoundCardProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#F8F9FA",
        fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 380,
          width: "100%",
          background: "#FFFFFF",
          borderRadius: 24,
          padding: "32px 28px",
          textAlign: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          border: "1px solid #EEEEEE",
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 8 }}>{emoji}</div>
        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: 24,
            fontWeight: 800,
            color: "#1A1C23",
            marginBottom: 8,
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 14, color: "#7A8090", lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
    </div>
  );
}
