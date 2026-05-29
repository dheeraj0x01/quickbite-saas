"use client";

import { useCallback, useEffect, useState } from "react";

type Toast = { id: number; kind: "info" | "success" | "error"; message: string };

/**
 * Tiny toast hook for the admin panel — shows one transient message at a
 * time. Returned `Toast` should be rendered by the caller.
 */
export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  const show = useCallback(
    (message: string, kind: Toast["kind"] = "info") => {
      setToast({ id: Date.now(), kind, message });
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  return { toast, show };
}
