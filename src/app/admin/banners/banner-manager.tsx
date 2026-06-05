"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ImagePicker } from "@/components/admin/image-picker";
import { Plus, Trash2, Eye, EyeOff, GripVertical, Save, Loader2, X, ChevronUp, ChevronDown, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

interface BannerItem {
  id: string;
  title: string | null;
  subtitle: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  mediaUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export function BannerManager({ initialBanners }: { initialBanners: BannerItem[] }) {
  const router = useRouter();
  const [banners, setBanners] = useState<BannerItem[]>(initialBanners);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // New banner form state
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newCtaText, setNewCtaText] = useState("");
  const [newCtaLink, setNewCtaLink] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newLink, setNewLink] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editCtaText, setEditCtaText] = useState("");
  const [editCtaLink, setEditCtaLink] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editImage, setEditImage] = useState("");

  const handleAdd = async () => {
    if (!newImage) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle || null,
          subtitle: newSubtitle || null,
          ctaText: newCtaText || null,
          ctaLink: newCtaLink || null,
          mediaUrl: newImage,
          linkUrl: newLink || null,
          sortOrder: banners.length,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBanners([...banners, data.banner]);
        setNewTitle(""); setNewSubtitle(""); setNewCtaText(""); setNewCtaLink("");
        setNewImage(""); setNewLink("");
        setShowAdd(false);
        router.refresh();
      }
    } catch {}
    setAdding(false);
  };

  const startEdit = (banner: BannerItem) => {
    setEditingId(banner.id);
    setEditTitle(banner.title || "");
    setEditSubtitle(banner.subtitle || "");
    setEditCtaText(banner.ctaText || "");
    setEditCtaLink(banner.ctaLink || "");
    setEditLink(banner.linkUrl || "");
    setEditImage(banner.mediaUrl);
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle || null,
          subtitle: editSubtitle || null,
          ctaText: editCtaText || null,
          ctaLink: editCtaLink || null,
          linkUrl: editLink || null,
          mediaUrl: editImage,
        }),
      });
      if (res.ok) {
        setBanners(banners.map(b => b.id === id ? {
          ...b, title: editTitle || null, subtitle: editSubtitle || null,
          ctaText: editCtaText || null, ctaLink: editCtaLink || null,
          linkUrl: editLink || null, mediaUrl: editImage,
        } : b));
        setEditingId(null);
        router.refresh();
      }
    } catch {}
    setSaving(null);
  };

  const handleToggleActive = async (banner: BannerItem) => {
    setSaving(banner.id);
    try {
      await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      setBanners(banners.map(b => b.id === banner.id ? { ...b, isActive: !b.isActive } : b));
      router.refresh();
    } catch {}
    setSaving(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      setBanners(banners.filter(b => b.id !== id));
      router.refresh();
    } catch {}
    setDeleting(null);
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= banners.length) return;

    const updated = [...banners];
    [updated[index], updated[swapIdx]] = [updated[swapIdx], updated[index]];
    updated.forEach((b, i) => (b.sortOrder = i));
    setBanners(updated);

    await Promise.all([
      fetch(`/api/admin/banners/${updated[index].id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: index }),
      }),
      fetch(`/api/admin/banners/${updated[swapIdx].id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: swapIdx }),
      }),
    ]);
    router.refresh();
  };

  const inputCls = "w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-4">
      {banners.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center"><span className="text-3xl">🖼️</span></div>
          <p className="text-muted-foreground">No banners yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first hero banner below</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, idx) => (
            <div key={banner.id}>
              <div className={`flex items-center gap-4 bg-white rounded-xl border p-3 transition-all ${banner.isActive ? "border-border" : "border-border/50 opacity-60"}`}>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleMove(idx, "up")} disabled={idx === 0} className="p-0.5 rounded hover:bg-muted disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => handleMove(idx, "down")} disabled={idx === banners.length - 1} className="p-0.5 rounded hover:bg-muted disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
                </div>
                <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <Image src={banner.mediaUrl} alt={banner.title || "Banner"} fill className="object-cover" sizes="128px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{banner.title || "Untitled Banner"}</p>
                  {banner.subtitle && <p className="text-xs text-muted-foreground truncate">{banner.subtitle}</p>}
                  {banner.ctaText && <p className="text-xs text-primary truncate mt-0.5">CTA: {banner.ctaText}</p>}
                  {banner.linkUrl && <p className="text-xs text-muted-foreground truncate mt-0.5">Link: {banner.linkUrl}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => editingId === banner.id ? setEditingId(null) : startEdit(banner)} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleToggleActive(banner)} disabled={saving === banner.id}
                    className={`p-2 rounded-lg transition-colors ${banner.isActive ? "text-green-600 hover:bg-green-50" : "text-muted-foreground hover:bg-muted"}`}
                    title={banner.isActive ? "Active" : "Hidden"}>
                    {saving === banner.id ? <Loader2 className="w-4 h-4 animate-spin" /> : banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(banner.id)} disabled={deleting === banner.id} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                    {deleting === banner.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editingId === banner.id && (
                <div className="bg-white rounded-xl border border-primary/20 p-4 mt-2 space-y-3">
                  <ImagePicker value={editImage} onChange={setEditImage} folder="banners" label="Banner Image" aspectRatio="banner" />
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Title (shown on banner)</label>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="e.g., Fresh Eggless Cakes" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Subtitle / Description</label>
                    <textarea value={editSubtitle} onChange={e => setEditSubtitle(e.target.value)} placeholder="e.g., Premium cakes delivered same-day" rows={2} className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">CTA Button Text</label>
                      <input value={editCtaText} onChange={e => setEditCtaText(e.target.value)} placeholder="e.g., Order Now" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1">CTA Button Link</label>
                      <input value={editCtaLink} onChange={e => setEditCtaLink(e.target.value)} placeholder="/store/kuchaman-city/menu" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Link URL (when clicking banner)</label>
                    <input value={editLink} onChange={e => setEditLink(e.target.value)} placeholder="/store/kuchaman-city/menu" className={inputCls} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(banner.id)} disabled={saving === banner.id}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                      {saving === banner.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Banner */}
      {showAdd ? (
        <div className="bg-white rounded-2xl border border-primary/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Add New Banner</h3>
            <button onClick={() => setShowAdd(false)} className="p-1 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
          <ImagePicker value={newImage} onChange={setNewImage} folder="banners" label="Banner Image" aspectRatio="banner" />
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Title (shown on banner, optional)</label>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g., Fresh Eggless Cakes" className={inputCls} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Subtitle / Description (optional)</label>
            <textarea value={newSubtitle} onChange={e => setNewSubtitle(e.target.value)} placeholder="e.g., Premium cakes delivered same-day" rows={2} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">CTA Button Text (optional)</label>
              <input value={newCtaText} onChange={e => setNewCtaText(e.target.value)} placeholder="e.g., Order Now" className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">CTA Button Link (optional)</label>
              <input value={newCtaLink} onChange={e => setNewCtaLink(e.target.value)} placeholder="/store/kuchaman-city/menu" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Link URL (when clicking banner, optional)</label>
            <input value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="/store/kuchaman-city/menu?category=cakes" className={inputCls} />
          </div>
          <button onClick={handleAdd} disabled={!newImage || adding}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Add Banner
          </button>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full py-4 border-2 border-dashed border-primary/30 rounded-2xl text-primary font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> Add New Banner
        </button>
      )}
    </div>
  );
}

