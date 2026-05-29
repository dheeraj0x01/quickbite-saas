"use client";

import { useRef, useState } from "react";

type ImageUploaderProps = {
  value?: string;
  onChange: (url: string) => void;
  onError?: (message: string) => void;
};

/**
 * Reusable image picker:
 *   - Preview before upload
 *   - Posts the file to /api/admin/upload (Supabase Storage)
 *   - Calls back with the public URL
 */
export default function ImageUploader({
  value,
  onChange,
  onError,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  const handleFile = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        onError?.(json.error ?? "Upload failed");
        return;
      }
      onChange(json.url as string);
      setPreview(json.url as string);
    } catch {
      onError?.("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="admin-image-preview">
        {preview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={preview} alt="preview" />
        ) : (
          "No image selected"
        )}
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button
          type="button"
          className="admin-btn admin-btn-ghost"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : preview ? "Change Image" : "Upload Image"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {value && (
          <input
            className="admin-input"
            placeholder="Image URL"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ flex: 1 }}
          />
        )}
      </div>
    </div>
  );
}
