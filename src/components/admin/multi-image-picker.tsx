"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, GripVertical } from "lucide-react";

interface MultiImagePickerProps {
  value: string[]; // Array of image URLs
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  max?: number;
}

export function MultiImagePicker({ value, onChange, folder = "products", label = "Product Images", max = 5 }: MultiImagePickerProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    if (value.length + files.length > max) {
      alert(`Maximum ${max} images allowed`);
      return;
    }
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) { alert("Each image must be under 5 MB"); continue; }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          const asset = data.asset || data;
          if (asset.url) newUrls.push(asset.url);
        }
      } catch {}
    }
    onChange([...value, ...newUrls]);
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const arr = [...value];
    [arr[from], arr[to]] = [arr[to], arr[from]];
    onChange(arr);
  };

  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-2">{label} ({value.length}/{max})</label>

      {/* Image Grid */}
      <div className="flex gap-2 flex-wrap mb-2">
        {value.map((url, idx) => (
          <div key={`${url}-${idx}`} className="relative group w-72 h-72 md:w-[400px] md:h-[400px] rounded-2xl overflow-hidden border border-border bg-muted">
            <Image src={url} alt={`Image ${idx + 1}`} fill className="object-cover" sizes="400px" />
            {/* Controls overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              {idx > 0 && (
                <button type="button" onClick={() => moveImage(idx, idx - 1)} className="bg-white text-foreground w-7 h-7 rounded-lg text-xs flex items-center justify-center">←</button>
              )}
              <button type="button" onClick={() => removeImage(idx)} className="bg-red-500 text-white w-7 h-7 rounded-lg flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
              {idx < value.length - 1 && (
                <button type="button" onClick={() => moveImage(idx, idx + 1)} className="bg-white text-foreground w-7 h-7 rounded-lg text-xs flex items-center justify-center">→</button>
              )}
            </div>
            {idx === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[10px] text-center py-0.5 font-medium">Main</span>
            )}
          </div>
        ))}

        {/* Add button */}
        {value.length < max && (
          <button
            type="button"
            onClick={() => !uploading && fileRef.current?.click()}
            className={`w-72 h-72 md:w-[400px] md:h-[400px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
              uploading ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 bg-muted/30"
            }`}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <>
                <Upload className="w-4 h-4 text-muted-foreground mb-0.5" />
                <span className="text-[9px] text-muted-foreground">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">First image is the main display image. Drag arrows to reorder. JPG, PNG, WebP · Max 5 MB each.</p>

      <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleUpload(e.target.files)} className="hidden" />
    </div>
  );
}
