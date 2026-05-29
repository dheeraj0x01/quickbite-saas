"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/ssr-client";

type LogoutButtonProps = {
  className?: string;
  label?: string;
};

/**
 * Sign-out button: clears the Supabase session + the role cookie, then
 * redirects to /login.
 */
export default function LogoutButton({
  className,
  label = "Sign out",
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const supabase = getBrowserClient();
      await supabase.auth.signOut();
      // Clear our role cookie via a small endpoint.
      await fetch("/api/auth/sync", { method: "DELETE" });
      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("[logout]", err);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={className ?? "admin-mini-btn"}
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "Signing out…" : label}
    </button>
  );
}
