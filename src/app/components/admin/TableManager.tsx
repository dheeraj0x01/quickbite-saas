"use client";

import { useEffect, useState } from "react";
import { RestaurantTableRow } from "@/lib/types/database";
import { useToast } from "@/app/hooks/useToast";
import Toast from "./Toast";

/**
 * Admin table management:
 *   - List all tables with counts
 *   - Add a new table (auto-numbers next available)
 *   - Delete a table
 *   - Quick links to QR dashboard for printing/regenerating QR
 */
export default function TableManager({ slug }: { slug: string }) {
  const [tables, setTables] = useState<RestaurantTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast, show } = useToast();

  const reload = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/tables?slug=${slug}`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (json.ok) setTables(json.tables as RestaurantTableRow[]);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async () => {
    setAdding(true);
    const res = await fetch(`/api/admin/tables?slug=${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    setAdding(false);
    if (!res.ok || !json.ok) {
      show(json.error ?? "Failed to add", "error");
      return;
    }
    show(`Table ${json.table.table_number} added`, "success");
    reload();
  };

  const handleDelete = async (tbl: RestaurantTableRow) => {
    if (!confirm(`Delete Table ${tbl.table_number}? This is irreversible.`))
      return;
    const res = await fetch(`/api/admin/tables/${tbl.id}?slug=${slug}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      show("Delete failed", "error");
      return;
    }
    setTables((prev) => prev.filter((t) => t.id !== tbl.id));
    show("Table removed", "success");
  };

  return (
    <div>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Tables</h1>
          <div className="admin-page-sub">
            {tables.length} table{tables.length === 1 ? "" : "s"} • QR codes auto-update
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a className="admin-btn admin-btn-ghost" href="/admin/qr">
            🔳 QR Dashboard
          </a>
          <button className="admin-btn" onClick={handleAdd} disabled={adding}>
            {adding ? "Adding…" : "+ Add Table"}
          </button>
        </div>
      </header>

      <section className="admin-panel">
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Table #</th>
                <th>Customer URL</th>
                <th>Created</th>
                <th style={{ textAlign: "right", width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} style={{ color: "#8e96b7" }}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading &&
                tables.map((t) => {
                  const url =
                    typeof window !== "undefined"
                      ? `${window.location.origin}/r/${slug}/t/${t.table_number}`
                      : `/r/${slug}/t/${t.table_number}`;
                  return (
                    <tr key={t.id}>
                      <td>
                        <span className="admin-badge brand">
                          🍽 {t.table_number}
                        </span>
                      </td>
                      <td
                        style={{
                          fontFamily: "monospace",
                          color: "#8e96b7",
                          fontSize: 12,
                        }}
                      >
                        /r/{slug}/t/{t.table_number}
                      </td>
                      <td style={{ color: "#8e96b7", fontSize: 12 }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <a className="admin-mini-btn" href={url} target="_blank" rel="noreferrer">
                            View Menu
                          </a>
                          <a
                            className="admin-mini-btn"
                            href={`/admin/qr?slug=${slug}#table-${t.table_number}`}
                          >
                            QR
                          </a>
                          <button
                            className="admin-mini-btn danger"
                            onClick={() => handleDelete(t)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {!loading && tables.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "#8e96b7" }}>
                    No tables yet. Click <strong>Add Table</strong> to create one.
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
