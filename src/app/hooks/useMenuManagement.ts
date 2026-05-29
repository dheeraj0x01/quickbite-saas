"use client";

import { useCallback, useEffect, useState } from "react";
import { MenuItemRow } from "@/lib/types/database";
import { CategoryRow, MenuItemInput } from "@/lib/types/admin";

/**
 * Centralizes all menu-CRUD calls for the admin /menu page.
 *
 * Returns lists, loading flag, and create/update/delete actions that
 * keep local state in sync without requiring a full page refresh.
 */
export function useMenuManagement(slug: string) {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, c] = await Promise.all([
        fetch(`/api/admin/menu?slug=${slug}`, { cache: "no-store" }).then((r) =>
          r.json(),
        ),
        fetch(`/api/admin/categories?slug=${slug}`, {
          cache: "no-store",
        }).then((r) => r.json()),
      ]);
      if (m.ok) setItems(m.items);
      if (c.ok) setCategories(c.categories);
    } catch {
      setError("Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (input: MenuItemInput) => {
      const res = await fetch(`/api/admin/menu?slug=${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Create failed");
      setItems((prev) => [...prev, json.item as MenuItemRow]);
      return json.item as MenuItemRow;
    },
    [slug],
  );

  const update = useCallback(
    async (id: string, input: Partial<MenuItemInput>) => {
      const res = await fetch(`/api/admin/menu/${id}?slug=${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Update failed");
      setItems((prev) =>
        prev.map((i) => (i.id === id ? (json.item as MenuItemRow) : i)),
      );
      return json.item as MenuItemRow;
    },
    [slug],
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/menu/${id}?slug=${slug}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error("Delete failed");
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [slug],
  );

  return { items, categories, loading, error, create, update, remove, reload };
}
