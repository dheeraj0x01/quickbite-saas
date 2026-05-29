"use client";

import { useMemo, useState } from "react";
import { MenuItemRow } from "@/lib/types/database";
import { CategoryRow, MenuItemInput } from "@/lib/types/admin";
import { useMenuManagement } from "@/app/hooks/useMenuManagement";
import { useToast } from "@/app/hooks/useToast";
import MenuFormModal from "./MenuFormModal";
import Toast from "./Toast";

type Mode = "create" | "edit";

/**
 * Searchable, filterable menu management table.
 * Owns: search input, category filter, modal open state, and selected row.
 * Delegates CRUD to `useMenuManagement`.
 */
export default function MenuTable({ slug }: { slug: string }) {
  const {
    items,
    categories,
    loading,
    error,
    create,
    update,
    remove,
  } = useMenuManagement(slug);
  const { toast, show } = useToast();

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [selected, setSelected] = useState<MenuItemRow | null>(null);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filterCat && i.category !== filterCat) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          i.name.toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, search, filterCat]);

  const openCreate = () => {
    setMode("create");
    setSelected(null);
    setModalOpen(true);
  };
  const openEdit = (item: MenuItemRow) => {
    setMode("edit");
    setSelected(item);
    setModalOpen(true);
  };

  const handleSubmit = async (input: MenuItemInput) => {
    try {
      if (mode === "edit" && selected) {
        await update(selected.id, input);
        show("Item updated", "success");
      } else {
        await create(input);
        show("Item created", "success");
      }
      setModalOpen(false);
    } catch (e) {
      show(e instanceof Error ? e.message : "Save failed", "error");
      throw e;
    }
  };

  const handleDelete = async (item: MenuItemRow) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await remove(item.id);
      show("Item deleted", "success");
    } catch {
      show("Delete failed", "error");
    }
  };

  const toggleStock = async (item: MenuItemRow) => {
    try {
      await update(item.id, { in_stock: !item.in_stock });
      show(
        item.in_stock ? "Marked unavailable" : "Marked available",
        "success",
      );
    } catch {
      show("Update failed", "error");
    }
  };

  return (
    <div>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Menu</h1>
          <div className="admin-page-sub">
            {items.length} item{items.length === 1 ? "" : "s"} • live on customer menu
          </div>
        </div>
        <button className="admin-btn" onClick={openCreate}>
          + Add Menu Item
        </button>
      </header>

      <div className="admin-search-row">
        <input
          className="admin-input"
          placeholder="Search by name or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-select"
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <section className="admin-panel">
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>Tags</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th>Stock</th>
                <th style={{ textAlign: "right", width: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} style={{ color: "#8e96b7" }}>
                    Loading…
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td colSpan={8} style={{ color: "#f87171" }}>
                    {error}
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            background: "#0d0f17",
                            border: "1px solid #2e324e",
                            fontSize: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {item.emoji ?? "🍽"}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "#8e96b7" }}>
                        {(item.description ?? "").slice(0, 60)}
                      </div>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>
                      {item.category}
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${item.veg ? "veg" : "nonveg"}`}
                      >
                        {item.veg ? "Veg" : "Non-Veg"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(item.tags ?? []).map((t) => (
                          <span key={t} className="admin-badge brand">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      ₹{Number(item.price)}
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${
                          item.in_stock ? "veg" : "nonveg"
                        }`}
                      >
                        {item.in_stock ? "In Stock" : "Sold Out"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          className="admin-mini-btn"
                          onClick={() => toggleStock(item)}
                        >
                          {item.in_stock ? "Disable" : "Enable"}
                        </button>
                        <button
                          className="admin-mini-btn"
                          onClick={() => openEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-mini-btn danger"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ color: "#8e96b7" }}>
                    No items match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <MenuFormModal
        open={modalOpen}
        mode={mode}
        initial={selected}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      {toast && <Toast message={toast.message} kind={toast.kind} />}
    </div>
  );
}
