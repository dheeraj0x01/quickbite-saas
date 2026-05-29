"use client";

import { useEffect, useState } from "react";
import { RestaurantSettingsRow } from "@/lib/types/admin";
import { useToast } from "@/app/hooks/useToast";
import Toast from "./Toast";
import ImageUploader from "./ImageUploader";

/**
 * Restaurant settings form.
 * Loads current values, applies edits in local state, persists via PATCH.
 */
export default function SettingsForm({ slug }: { slug: string }) {
  const [settings, setSettings] = useState<RestaurantSettingsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, show } = useToast();

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/admin/settings?slug=${slug}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.ok) setSettings(json.settings);
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div>
        <header className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Settings</h1>
          </div>
        </header>
        <div className="admin-panel admin-panel-body">Loading…</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div>
        <header className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Settings</h1>
          </div>
        </header>
        <div className="admin-panel admin-panel-body">
          Restaurant <code>{slug}</code> not found.
        </div>
      </div>
    );
  }

  const update = (patch: Partial<RestaurantSettingsRow>) =>
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const res = await fetch(`/api/admin/settings?slug=${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: settings.name,
        subtitle: settings.subtitle,
        rating: settings.rating,
        prep_time: settings.prep_time,
        logo_url: settings.logo_url,
        banner_url: settings.banner_url,
        contact_phone: settings.contact_phone,
        address: settings.address,
        open_hours: settings.open_hours,
        gst_percent: settings.gst_percent,
        theme_color: settings.theme_color,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok || !json.ok) {
      show("Save failed", "error");
      return;
    }
    setSettings(json.settings);
    show("Settings saved", "success");
  };

  return (
    <div>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Settings</h1>
          <div className="admin-page-sub">
            Brand identity, contact, and operational preferences
          </div>
        </div>
        <button className="admin-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </header>

      <section className="admin-panel">
        <header className="admin-panel-header">
          <div className="admin-panel-title">Brand</div>
        </header>
        <div className="admin-panel-body">
          <div className="admin-form-grid">
            <div className="admin-field">
              <label className="admin-label">Restaurant Name</label>
              <input
                className="admin-input"
                value={settings.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Subtitle</label>
              <input
                className="admin-input"
                value={settings.subtitle ?? ""}
                onChange={(e) => update({ subtitle: e.target.value })}
              />
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label className="admin-label">Logo</label>
              <ImageUploader
                value={settings.logo_url ?? ""}
                onChange={(url) => update({ logo_url: url })}
                onError={(m) => show(m, "error")}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Banner</label>
              <ImageUploader
                value={settings.banner_url ?? ""}
                onChange={(url) => update({ banner_url: url })}
                onError={(m) => show(m, "error")}
              />
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label className="admin-label">Theme Color</label>
              <input
                className="admin-input"
                type="color"
                value={settings.theme_color}
                onChange={(e) => update({ theme_color: e.target.value })}
                style={{ height: 42, padding: 4 }}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Rating</label>
              <input
                className="admin-input"
                type="number"
                step={0.1}
                min={0}
                max={5}
                value={settings.rating ?? ""}
                onChange={(e) =>
                  update({ rating: Number(e.target.value) || null })
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <header className="admin-panel-header">
          <div className="admin-panel-title">Operations</div>
        </header>
        <div className="admin-panel-body">
          <div className="admin-form-grid">
            <div className="admin-field">
              <label className="admin-label">Prep Time</label>
              <input
                className="admin-input"
                value={settings.prep_time ?? ""}
                onChange={(e) => update({ prep_time: e.target.value })}
                placeholder="15-20 min"
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">GST Percent</label>
              <input
                className="admin-input"
                type="number"
                min={0}
                max={28}
                step={0.1}
                value={settings.gst_percent}
                onChange={(e) =>
                  update({ gst_percent: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-label">Open Hours</label>
            <input
              className="admin-input"
              value={settings.open_hours ?? ""}
              onChange={(e) => update({ open_hours: e.target.value })}
              placeholder="Mon–Sun • 11:00 AM – 11:00 PM"
            />
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <header className="admin-panel-header">
          <div className="admin-panel-title">Contact</div>
        </header>
        <div className="admin-panel-body">
          <div className="admin-form-grid">
            <div className="admin-field">
              <label className="admin-label">Phone</label>
              <input
                className="admin-input"
                value={settings.contact_phone ?? ""}
                onChange={(e) => update({ contact_phone: e.target.value })}
                placeholder="+91 99999 99999"
              />
            </div>
          </div>
          <div className="admin-field">
            <label className="admin-label">Address</label>
            <textarea
              className="admin-textarea"
              value={settings.address ?? ""}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="Street, City, Pincode"
            />
          </div>
        </div>
      </section>

      {toast && <Toast message={toast.message} kind={toast.kind} />}
    </div>
  );
}
