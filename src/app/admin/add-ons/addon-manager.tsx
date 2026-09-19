"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Plus, Trash2, Save, Upload, ImageIcon, GripVertical, Pencil, X, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface AddOnItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

interface Props {
  initialAddOns: AddOnItem[];
}

const CATEGORIES = [
  { value: "GIFT", label: "🎁 Gift", desc: "Bouquets, chocolates, teddy bears" },
  { value: "DECORATION", label: "🎉 Decoration", desc: "Candles, toppers, balloons" },
  { value: "ACCESSORY", label: "✨ Accessory", desc: "Knife, plates, greeting cards" },
];

export function AddOnManager({ initialAddOns }: Props) {
  const [addOns, setAddOns] = useState<AddOnItem[]>(initialAddOns);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("DECORATION");
  const [formImage, setFormImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormCategory("DECORATION");
    setFormImage(null);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (addon: AddOnItem) => {
    setFormName(addon.name);
    setFormPrice(String(addon.price));
    setFormCategory(addon.category);
    setFormImage(addon.image);
    setEditingId(addon.id);
    setShowForm(true);
  };

  const uploadImage = async (file: File, targetId?: string) => {
    const loadingKey = targetId || "new";
    setUploading(loadingKey);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "addons");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.success && data.asset?.url) {
        if (targetId) {
          // Update existing addon image
          await saveField(targetId, "image", data.asset.url);
          setAddOns((prev) => prev.map((a) => a.id === targetId ? { ...a, image: data.asset.url } : a));
        } else {
          setFormImage(data.asset.url);
        }
      }
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      setUploading(null);
    }
  };

  const saveField = async (id: string, field: string, value: unknown) => {
    await fetch("/api/admin/addons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrice) return;
    setSaving(true);
    try {
      const body = {
        name: formName.trim(),
        price: parseFloat(formPrice),
        category: formCategory,
        image: formImage,
      };

      if (editingId) {
        await fetch("/api/admin/addons", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...body }),
        });
        setAddOns((prev) => prev.map((a) => a.id === editingId ? { ...a, ...body } : a));
      } else {
        const res = await fetch("/api/admin/addons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.addon) {
          setAddOns((prev) => [...prev, data.addon]);
        }
      }
      resetForm();
    } catch (e) {
      console.error("Save failed:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this add-on?")) return;
    await fetch("/api/admin/addons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAddOns((prev) => prev.filter((a) => a.id !== id));
  };

  const handleToggle = async (id: string) => {
    const addon = addOns.find((a) => a.id === id);
    if (!addon) return;
    const newActive = !addon.isActive;
    await saveField(id, "isActive", newActive);
    setAddOns((prev) => prev.map((a) => a.id === id ? { ...a, isActive: newActive } : a));
  };

  const removeImage = async (id: string) => {
    await saveField(id, "image", null);
    setAddOns((prev) => prev.map((a) => a.id === id ? { ...a, image: null } : a));
  };

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: addOns.filter((a) => a.category === cat.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => {
          const count = addOns.filter((a) => a.category === cat.value).length;
          const active = addOns.filter((a) => a.category === cat.value && a.isActive).length;
          return (
            <div key={cat.value} className="bg-white rounded-xl border border-border p-3">
              <p className="text-lg mb-0.5">{cat.label.split(" ")[0]}</p>
              <p className="text-sm font-bold text-foreground">{count} {count === 1 ? "item" : "items"}</p>
              <p className="text-[10px] text-muted-foreground">{active} active</p>
            </div>
          );
        })}
      </div>

      {/* Add-Ons List grouped by category */}
      {grouped.map((group) => (
        <div key={group.value}>
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            {group.label} <span className="text-xs font-normal text-muted-foreground">— {group.desc}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.items.map((addon) => (
              <div
                key={addon.id}
                className={`bg-white rounded-xl border overflow-hidden transition-all ${
                  addon.isActive ? "border-border" : "border-border opacity-50"
                }`}
              >
                {/* Image area */}
                <div className="aspect-[3/2] relative bg-muted group">
                  {addon.image ? (
                    <>
                      <Image src={addon.image} alt={addon.name} fill className="object-cover" sizes="300px" />
                      {/* Image actions overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <label className="p-2 bg-white rounded-full cursor-pointer hover:bg-primary/10 transition-colors">
                          <Upload className="w-4 h-4 text-foreground" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadImage(f, addon.id);
                            }}
                          />
                        </label>
                        <button
                          onClick={() => removeImage(addon.id)}
                          className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
                      {uploading === addon.id ? (
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-muted-foreground/40 mb-1" />
                          <span className="text-[10px] text-muted-foreground">Click to upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadImage(f, addon.id);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{addon.name}</p>
                      <p className="text-xs font-bold text-primary">{formatPrice(addon.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(addon)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleToggle(addon.id)}
                        className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                          addon.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {addon.isActive ? "Active" : "Off"}
                      </button>
                      <button
                        onClick={() => handleDelete(addon.id)}
                        className="p-1.5 rounded-lg text-destructive hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {addOns.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-border">
          <p className="text-3xl mb-2">🎁</p>
          <p className="text-sm text-muted-foreground mb-3">No add-ons yet. Add candles, bouquets, greeting cards etc.</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm ? (
        <div className="bg-white rounded-2xl border-2 border-primary/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              {editingId ? <Pencil className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
              {editingId ? "Edit Add-On" : "New Add-On"}
            </h2>
            <button onClick={resetForm} className="p-1 rounded-full hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Image upload for new item */}
          <div className="flex items-center gap-4">
            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden relative bg-muted">
              {uploading === "new" ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : formImage ? (
                <Image src={formImage} alt="Preview" fill className="object-cover" sizes="96px" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-muted-foreground mb-0.5" />
                  <span className="text-[9px] text-muted-foreground">Upload</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                }}
              />
            </label>
            {formImage && (
              <button onClick={() => setFormImage(null)} className="text-xs text-destructive hover:underline">
                Remove image
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Name *</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Birthday Candles"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Price (₹) *</label>
              <input
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                inputMode="decimal"
                placeholder="50"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={resetForm} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formPrice}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save className="w-4 h-4" /> {editingId ? "Update" : "Add"}</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Add-On
        </button>
      )}
    </div>
  );
}
