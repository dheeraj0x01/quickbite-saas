"use client";

import { useState } from "react";

type FeedbackCardProps = {
  restaurantSlug: string;
  tableNumber: number;
  orderId: string;
  onSubmitted?: () => void;
};

type Stars = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Inline customer feedback card. Renders three star rows + an optional
 * comment, posts to /api/feedback, then collapses into a thank-you state.
 *
 * Self-contained: does not depend on any global state or hook beyond its
 * own props. Drop it into any "thank you" surface.
 */
export default function FeedbackCard({
  restaurantSlug,
  tableNumber,
  orderId,
  onSubmitted,
}: FeedbackCardProps) {
  const [food, setFood] = useState<Stars>(0);
  const [service, setService] = useState<Stars>(0);
  const [overall, setOverall] = useState<Stars>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit = food > 0 && service > 0 && overall > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_slug: restaurantSlug,
          table_number: tableNumber,
          order_id: orderId,
          overall_rating: overall,
          food_rating: food,
          service_rating: service,
          comment: comment.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const message = json?.error ?? "Could not submit feedback.";
        setError(message);
        return;
      }
      setDone(true);
      onSubmitted?.();
    } catch {
      setError("Could not submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="fb-card fb-card-done">
        <div className="fb-thanks-icon">⭐</div>
        <div className="fb-thanks-title">Thank you for your feedback!</div>
        <div className="fb-thanks-sub">
          Your rating helps the kitchen serve better next time.
        </div>
      </div>
    );
  }

  return (
    <div className="fb-card">
      <div className="fb-title">Rate your experience</div>
      <div className="fb-sub">A quick rating from you means a lot.</div>

      <StarRow label="Food Quality" value={food} onChange={setFood} />
      <StarRow label="Service" value={service} onChange={setService} />
      <StarRow label="Overall Experience" value={overall} onChange={setOverall} />

      <div className="fb-field">
        <label className="fb-label">Comment (optional)</label>
        <textarea
          className="fb-textarea"
          rows={3}
          maxLength={500}
          placeholder="Tell us what we can improve…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {error && <div className="fb-error">{error}</div>}

      <button
        className="fb-submit"
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
      >
        {submitting ? "Submitting…" : "Submit Feedback"}
      </button>
    </div>
  );
}

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Stars;
  onChange: (v: Stars) => void;
}) {
  const [hover, setHover] = useState<Stars>(0);
  const display = (hover || value) as Stars;
  return (
    <div className="fb-row">
      <div className="fb-row-label">{label}</div>
      <div className="fb-stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} stars`}
            className={`fb-star ${n <= display ? "fb-star-on" : ""}`}
            onMouseEnter={() => setHover(n as Stars)}
            onClick={() => onChange(n as Stars)}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
