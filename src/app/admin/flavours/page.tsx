"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, GripVertical, Save, Loader2 } from "lucide-react";

export default function AdminFlavoursPage() {
  const [flavours, setFlavours] = useState<string[]>([]);
  const [newFlavour, setNewFlavour] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/flavours")
      .then((r) => r.json())
      .then((data) => {
        if (data.flavours && data.flavours.length > 0) {
          setFlavours(data.flavours);
        } else {
          // Seed with defaults if empty
          setFlavours([
            "Chocolate", "Chocochips", "Hazelnut", "Nutella", "Belgian Chocolate",
            "Almond Truffle", "Truffle Dutch", "Vanilla", "Butterscotch", "Salted Caramel",
            "Black Forest", "Red Velvet", "Pineapple", "Blueberry", "Strawberry",
            "Mango", "Raspberry", "Real Fruit", "Orange Almond Choco", "Rasmalai",
            "Kesar Pista", "Rose", "Filter Coffee", "Thandai", "Kunafa Pista",
            "KitKat", "Oreo", "Ferrero Rocher",
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addFlavour = () => {
    const val = newFlavour.trim();
    if (!val) return;
    if (flavours.some((f) => f.toLowerCase() === val.toLowerCase())) {
      setNewFlavour("");
      return;
    }
    setFlavours((prev) => [...prev, val]);
    setNewFlavour("");
  };

  const removeFlavour = (idx: number) => {
    setFlavours((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/flavours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flavours }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/menu/products" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold font-serif text-foreground">Manage Flavours</h1>
          <p className="text-xs text-muted-foreground">These flavours appear as default options when adding new products</p>
        </div>
      </div>

      {/* Add new flavour */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newFlavour}
          onChange={(e) => setNewFlavour(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addFlavour()}
          placeholder="Add a new flavour..."
          className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <button onClick={addFlavour} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Flavour list */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
        <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">{flavours.length} flavours</span>
        </div>
        <div className="divide-y divide-border">
          {flavours.map((f, idx) => (
            <div key={`${f}-${idx}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors group">
              <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-foreground">{f}</span>
              <button onClick={() => removeFlavour(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center no-min-touch">
                <X className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : saved ? <><Save className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Flavours</>}
      </button>
    </div>
  );
}
