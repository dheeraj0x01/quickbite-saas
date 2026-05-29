"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/ssr-client";

/**
 * Login form using Supabase email/password sign-in.
 *
 * Flow:
 *   1. Sign in via the browser SSR client — sets the auth cookies.
 *   2. POST to /api/auth/sync to fetch the user's role and store it as a
 *      lightweight `qb_role` cookie. The middleware reads this cookie to
 *      gate routes without doing a DB call on every navigation.
 *   3. Redirect to ?next= or the role's default landing page.
 */
export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = getBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setSubmitting(false);
        return;
      }

      // Sync role cookie + get default landing.
      const sync = await fetch("/api/auth/sync", { method: "POST" });
      const json = await sync.json();
      const target = next || (json?.landing as string) || "/admin/dashboard";

      router.replace(target);
      router.refresh();
    } catch (err) {
      console.error("[login]", err);
      setError("Unable to sign in. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form className="login-card" onSubmit={handleSubmit}>
      <div className="login-brand">
        <div className="login-brand-mark">🍴</div>
        <div>
          <div className="login-brand-name">QuickBite</div>
          <div className="login-brand-sub">Restaurant Console</div>
        </div>
      </div>

      <div className="login-title">Sign in</div>
      <div className="login-subtitle">
        Use your admin credentials to access the dashboard.
      </div>

      {error && <div className="login-error">{error}</div>}

      <div className="login-field">
        <label className="login-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="login-input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@restaurant.com"
        />
      </div>

      <div className="login-field">
        <label className="login-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="login-input"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <button className="login-btn" type="submit" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign In"}
      </button>

      <div className="login-foot">
        Trouble accessing? Contact your owner to provision an account.
      </div>
    </form>
  );
}
