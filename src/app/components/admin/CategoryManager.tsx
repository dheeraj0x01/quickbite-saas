"use client";

import { useEffect, useState } from "react";
import { CategoryRow } from "@/lib/types/admin";
import { useToast } from "@/app/hooks/useToast";
import Toast from "./Toast";

/**
 * Category management table:
 *   - List + reorder (move up / down)
 *   - Toggle visibility
 *   - Edit label / emoji
 *   - Create new
 *   - Delete
 */
export default function CategoryManager({ slug }: { slug: string }) {
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const { toast, show } = useToast();

  const reload = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/categories?slug=${slug}`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (json.ok) setItems(json.categories as CategoryRow[]);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!newLabel.trim() || !newSlug.trim()) {
      show("Slug and label are required", "error");
      return;
    }
    const res = await fetch(`/api/admin/categories?slug=${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: newSlug.trim(),
        label: newLabel.trim(),
        emoji: newEmoji.trim(),
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      show(json.error ?? "Create failed", "error");
      return;
    }
    setNewLabel("");
    setNewSlug("");
    setNewEmoji("");
    show("Category created", "success");
    reload();
  };

  const handleUpdate = async (
    id: string,
    patch: Partial<{
      label: string;
      emoji: string | null;
      visible: boolean;
      display_order: number;
    }>,
  ) => {
    const res = await fetch(`/api/admin/categories/${id}?slug=${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      show("Update failed", "error");
      return;
    }
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } as CategoryRow : c)),
    );
  };

  const handleDelete = async (cat: CategoryRow) => {
    if (
      !confirm(
        `Delete category "${cat.label}"? Items in this category will become orphaned.`,
      )
    )
      return;
    const res = await fetch(`/api/admin/categories/${cat.id}?slug=${slug}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      show("Delete failed", "error");
      return;
    }
    setItems((prev) => prev.filter((c) => c.id !== cat.id));
    show("Category deleted", "success");
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const next = [...items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    // Reassign display_order based on new positions and persist.
    const updates = next.map((c, i) => ({ ...c, display_order: i + 1 }));
    setItems(updates);
    for (const u of updates) {
      await handleUpdate(u.id, { display_order: u.display_order });
    }
  };

  return (
    <div>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Categories</h1>
          <div className="admin-page-sub">
            Organize the customer menu into sections
          </div>
        </div>
      </header>

      <section className="admin-panel">
        <header className="admin-panel-header">
          <div className="admin-panel-title">Add Category</div>
        </header>
        <div className="admin-panel-body">
          <div className="admin-form-grid">
            <div className="admin-field">
              <label className="admin-label">Slug</label>
              <input
                className="admin-input"
                placeholder="biryani"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Label</label>
              <input
                className="admin-input"
                placeholder="Biryani"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
          </div>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label className="admin-label">Emoji</label>
              <input
                className="admin-input"
                placeholder="🍛"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                maxLength={4}
              />
            </div>
            <div className="admin-field" style={{ alignSelf: "end" }}>
              <button className="admin-btn" onClick={handleCreate}>
                + Add Category
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Order</th>
                <th>Label</th>
                <th>Slug</th>
                <th>Emoji</th>
                <th>Visibility</th>
                <th style={{ textAlign: "right", width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ color: "#8e96b7" }}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((cat, i) => (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="admin-mini-btn"
                          onClick={() => move(cat.id, -1)}
                          disabled={i === 0}
                        >
                          ↑
                        </button>
                        <button
                          className="admin-mini-btn"
                          onClick={() => move(cat.id, 1)}
                          disabled={i === items.length - 1}
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        className="admin-input"
                        value={cat.label}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((c) =>
                              c.id === cat.id ? { ...c, label: e.target.value } : c,
                            ),
                          )
                        }
                        onBlur={() => handleUpdate(cat.id, { label: cat.label })}
                      />
                    </td>
                    <td style={{ fontFamily: "monospace", color: "#8e96b7" }}>
                      {cat.slug}
                    </td>
                    <td>
                      <input
                        className="admin-input"
                        style={{ width: 80 }}
                        value={cat.emoji ?? ""}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((c) =>
                              c.id === cat.id ? { ...c, emoji: e.target.value } : c,
                            ),
                          )
                        }
                        onBlur={() => handleUpdate(cat.id, { emoji: cat.emoji })}
                        maxLength={4}
                      />
                    </td>
                    <td>
                      <button
                        className="admin-mini-btn"
                        onClick={() =>
                          handleUpdate(cat.id, { visible: !cat.visible })
                        }
                      >
                        {cat.visible ? "Visible" : "Hidden"}
                      </button>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          className="admin-mini-btn danger"
                          onClick={() => handleDelete(cat)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "#8e96b7" }}>
                    No categories yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {toast && <Toast message={toast.message} kind={toast.kind} />}
    </div>
  );
}
