"use client";

import { useState, useRef } from "react";
import { Upload, Check, X, Loader2 } from "lucide-react";

export function AssetUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<{ url: string; filename: string }[]>([]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "products");

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          setUploaded((prev) => [...prev, { url: data.asset.url, filename: data.asset.filename }]);
        } else {
          setError(data.message || "Upload failed");
        }
      } catch {
        setError("Upload failed. Please try again.");
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5 mb-4">
      <h2 className="label-premium text-foreground mb-3">Upload Images</h2>

      <label className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer block">
        {uploading ? (
          <Loader2 className="w-6 h-6 text-primary mx-auto mb-2 animate-spin" />
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        )}
        <p className="text-sm text-muted-foreground">
          {uploading ? "Uploading..." : "Click to upload images"}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">JPEG, PNG, WebP (max 5MB)</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-destructive bg-red-50 rounded-lg px-3 py-2">
          <X className="w-4 h-4" /> {error}
        </div>
      )}

      {uploaded.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-foreground mb-2">Recently Uploaded ({uploaded.length})</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {uploaded.map((u, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <img src={u.url} alt={u.filename} className="w-full h-full object-cover" />
                <div className="absolute top-1 right-1 w-4 h-4 bg-success text-white rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 truncate">{u.filename}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Copy image URL to use in products: {uploaded[uploaded.length - 1]?.url}
          </p>
        </div>
      )}
    </div>
  );
}
