"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Trash2, Loader2, Copy, Check, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";

interface Asset {
  id: string;
  url: string;
  filename: string;
  folder: string;
  size: number;
  createdAt: string;
}

const FOLDERS = ["products", "banners", "branding", "general"];

export function AssetGallery({ initialAssets }: { initialAssets: Asset[] }) {
  const router = useRouter();
  const [assets, setAssets] = useState(initialAssets);
  const [uploading, setUploading] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadFolder, setUploadFolder] = useState("products");
  const [dragOver, setDragOver] = useState(false);

  const filtered = activeFolder ? assets.filter(a => a.folder === activeFolder) : assets;

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    const uploaded: Asset[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", uploadFolder);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          const asset = data.asset || data;
          uploaded.push({
            id: asset.id || Date.now().toString(),
            url: asset.url,
            filename: asset.filename || file.name,
            folder: uploadFolder,
            size: file.size,
            createdAt: new Date().toISOString(),
          });
        }
      } catch {}
    }
    setAssets([...uploaded, ...assets]);
    setUploading(false);
    router.refresh();
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`bg-white rounded-2xl border-2 border-dashed p-4 md:p-8 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground mx-auto mb-2 md:mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Drop images here or click to upload</p>
            <p className="text-xs text-muted-foreground mb-3 md:mb-4">JPG, PNG, WebP · Max 5 MB each</p>
            <div className="flex flex-col items-center gap-2 max-w-xs mx-auto">
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white"
              >
                {FOLDERS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                Choose Files
              </button>
            </div>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleUpload(e.target.files)} className="hidden" />
      </div>

      {/* Folder Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveFolder(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
            !activeFolder ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
          }`}
        >
          All ({assets.length})
        </button>
        {FOLDERS.map(f => {
          const count = assets.filter(a => a.folder === f).length;
          if (count === 0) return null;
          return (
            <button
              key={f}
              onClick={() => setActiveFolder(activeFolder === f ? null : f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                activeFolder === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
              }`}
            >
              <FolderOpen className="w-3 h-3" /> {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {/* Gallery Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <p className="text-3xl mb-2">📁</p>
          <p className="text-muted-foreground text-sm">No images {activeFolder ? `in ${activeFolder}` : "uploaded yet"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.filter(a => a.url).map((asset) => (
            <div key={asset.id} className="bg-white rounded-xl border border-border overflow-hidden group">
              <div className="relative aspect-square bg-muted">
                {asset.url && <Image src={asset.url} alt={asset.filename} fill className="object-cover" sizes="200px" />}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleCopy(asset.url)}
                    className="bg-white text-foreground p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Copy URL"
                  >
                    {copied === asset.url ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-[10px] text-foreground font-medium truncate">{asset.filename}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] text-muted-foreground">{formatSize(asset.size)}</span>
                  <span className="text-[9px] text-primary font-medium">{asset.folder}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
