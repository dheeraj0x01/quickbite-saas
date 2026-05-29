"use client";

import { useEffect, useState } from "react";
import { MenuItemRow } from "@/lib/types/database";
import { CategoryRow, MenuItemInput } from "@/lib/types/admin";
import ImageUploader from "./ImageUploader";

type Mode = "create" | "edit";

type MenuFormModalProps = {
  open: boolean;
  mode: Mode;
  initial?: MenuItemRow | null;
  categories: CategoryRow[];
  onClose: () => void;
  onSubmit: (input: MenuItemInput) => Promise<void>;
};

const TAGS = ["best", "spicy", "chef"] as const;

/**
 * Create / edit modal for a single menu item.
 * Handles its own form state. Submission is handled by the parent.
 */
export default function MenuFormModal({
  open,
  mode,
  initial,
  categories,
  onClose,
  onSubmit,
}: MenuFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [veg, setVeg] = useState(true);
  const [emoji, setEmoji] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setName(initial.name ?? "");
      setDescription(initial.description ?? "");
      setCategory(initial.category ?? categories[0]?.slug ?? "");
      setPrice(Number(initial.price ?? 0));
      setVeg(!!initial.veg);
      setEmoji(initial.emoji ?? "");
      setImageUrl(initial.image_url ?? "");
      setTags((initial.tags ?? []) as string[]);
      setInStock(initial.in_stock);
    } else {
      setName("");
      setDescription("");
      setCategory(categories[0]?.slug ?? "");
      setPrice(0);
      setVeg(true);
      setEmoji("");
      setImageUrl("");
      setTags([]);
      setInStock(true);
    }
    setError(null);
  }, [open, mode, initial, categories]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return setError("Name is required");
    if (!category) return setError("Pick a category");
    if (!Number.isFinite(price) || price <= 0) return setError("Price must be greater than 0");
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        category,
        price,
        veg,
        emoji: emoji.trim(),
        image_url: imageUrl.trim(),
        tags,
        in_stock: inStock,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal-header">
          <div className="admin-modal-title">
            {mode === "edit" ? "Edit Menu Item" : "Add Menu Item"}
          </div>
          <button className="admin-mini-btn" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="admin-modal-body">
          <div className="admin-field">
            <label className="admin-label">Photo</label>
            <ImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              onError={(m) => setError(m)}
            />
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label className="admin-label">Name *</label>
              <input
                className="admin-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Hyderabadi Dum Biryani"
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Emoji</label>
              <input
                className="admin-input"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🍛"
                maxLength={4}
              />
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-label">Description</label>
            <textarea
              className="admin-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Long-grain basmati rice with…"
            />
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label className="admin-label">Category *</label>
              <select
                className="admin-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">— pick category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label className="admin-label">Price (₹) *</label>
              <input
                className="admin-input"
                type="number"
                min={0}
                step={1}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="admin-checkbox-row">
            <input
              type="checkbox"
              id="veg-flag"
              checked={veg}
              onChange={(e) => setVeg(e.target.checked)}
            />
            <label htmlFor="veg-flag">Vegetarian</label>
          </div>
          <div className="admin-checkbox-row">
            <input
              type="checkbox"
              id="stock-flag"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
            />
            <label htmlFor="stock-flag">In stock / Available</label>
          </div>

          <div className="admin-field">
            <label className="admin-label">Badges</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    className="admin-mini-btn"
                    style={{
                      background: active ? "#e06a3b" : undefined,
                      color: active ? "#fff" : undefined,
                      borderColor: active ? "#e06a3b" : undefined,
                    }}
                    onClick={() =>
                      setTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : [...prev, tag],
                      )
                    }
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 8,
                padding: "8px 10px",
                color: "#fca5a5",
                fontSize: 12.5,
                marginTop: 8,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <footer className="admin-modal-footer">
          <button
            className="admin-btn admin-btn-ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="admin-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Item"}
          </button>
        </footer>
      </div>
    </div>
  );
}
