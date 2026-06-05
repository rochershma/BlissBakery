"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon, Loader2, Check, Trash2 } from "lucide-react";

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  aspectRatio?: "square" | "banner" | "free";
}

export function ImagePicker({ value, onChange, folder = "products", label = "Product Image", aspectRatio = "square" }: ImagePickerProps) {
  const [uploading, setUploading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [gallery, setGallery] = useState<{ url: string; filename: string }[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const aspectCls = aspectRatio === "banner" ? "aspect-[3/1]" : aspectRatio === "square" ? "aspect-square" : "aspect-video";

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5 MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const asset = data.asset || data;
      onChange(asset.url);
    } catch (err) {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [folder, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const openGallery = async () => {
    setShowGallery(true);
    setLoadingGallery(true);
    try {
      const res = await fetch(`/api/admin/assets?folder=${folder}`);
      if (res.ok) {
        const data = await res.json();
        setGallery(data.assets || []);
      }
    } catch {}
    setLoadingGallery(false);
  };

  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-2">{label}</label>

      {/* Current image or upload area */}
      {value ? (
        <div className="relative group">
          <div className={`${aspectCls} max-w-xs relative rounded-xl overflow-hidden border border-border bg-muted`}>
            <Image src={value} alt="Selected" fill className="object-cover" sizes="320px" />
          </div>
          <div className="absolute inset-0 max-w-xs rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="bg-white text-foreground px-3 py-2 rounded-lg text-xs font-medium hover:bg-muted transition-colors"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`${aspectCls} max-w-xs border-2 border-dashed rounded-xl transition-colors flex flex-col items-center justify-center cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-muted/30"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground font-medium">Drop image or click to upload</p>
              <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WebP · Max 5 MB</p>
            </>
          )}
        </div>
      )}

      {/* Browse gallery button */}
      <button
        type="button"
        onClick={openGallery}
        className="mt-2 text-xs text-primary font-medium hover:underline flex items-center gap-1"
      >
        <ImageIcon className="w-3.5 h-3.5" /> Browse uploaded images
      </button>

      <input type="hidden" name="__image" value={value} />
      <input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} className="hidden" />

      {/* Gallery Modal — fullscreen on mobile, centered on desktop */}
      {showGallery && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end md:items-center justify-center" onClick={() => setShowGallery(false)}>
          <div className="bg-white w-full md:max-w-2xl md:mx-4 rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[85vh] md:max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <h3 className="font-semibold text-foreground text-sm">Select Image</h3>
              <button onClick={() => setShowGallery(false)} className="p-1.5 hover:bg-muted rounded-full -mr-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-3 md:p-4">
              {loadingGallery ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : gallery.length === 0 ? (
                <div className="text-center py-10">
                  <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No images uploaded yet</p>
                  <button
                    type="button"
                    onClick={() => { setShowGallery(false); fileRef.current?.click(); }}
                    className="mt-3 text-sm text-primary font-medium hover:underline"
                  >
                    Upload your first image
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
                  {gallery.map((asset) => (
                    <button
                      key={asset.url}
                      type="button"
                      onClick={() => { onChange(asset.url); setShowGallery(false); }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all active:scale-95 ${
                        value === asset.url ? "border-primary ring-2 ring-primary/30" : "border-border"
                      }`}
                    >
                      <Image src={asset.url} alt={asset.filename} fill className="object-cover" sizes="120px" />
                      {value === asset.url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Upload from gallery modal */}
            <div className="p-3 md:p-4 border-t border-border flex-shrink-0">
              <button
                type="button"
                onClick={() => { setShowGallery(false); fileRef.current?.click(); }}
                className="w-full py-2.5 border border-dashed border-primary/50 rounded-xl text-sm text-primary font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> Upload New Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
