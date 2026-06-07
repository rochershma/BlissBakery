"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Save, Loader2, DollarSign, Ruler } from "lucide-react";

interface FlavourPrice { name: string; price500g: number }
interface CustomSize { kg: number; name: string; serves: string }

const DEFAULT_FLAVOUR_PRICE = 300;

export default function AdminFlavoursPage() {
  const [flavours, setFlavours] = useState<string[]>([]);
  const [flavourPrices, setFlavourPrices] = useState<FlavourPrice[]>([]);
  const [customSizes, setCustomSizes] = useState<CustomSize[]>([]);
  const [defaultBase, setDefaultBase] = useState(DEFAULT_FLAVOUR_PRICE);
  const [newFlavour, setNewFlavour] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/flavours")
      .then((r) => r.json())
      .then((data) => {
        if (data.flavours?.length > 0) setFlavours(data.flavours);
        if (data.flavourPrices?.length > 0) setFlavourPrices(data.flavourPrices);
        if (data.customSizes?.length > 0) setCustomSizes(data.customSizes);
        if (data.defaultBase500gPrice) setDefaultBase(data.defaultBase500gPrice);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Sync flavour prices with flavour list
  useEffect(() => {
    if (flavours.length === 0) return;
    setFlavourPrices((prev) => {
      const existing = new Map(prev.map((fp) => [fp.name, fp.price500g]));
      return flavours.map((f) => ({ name: f, price500g: existing.get(f) ?? defaultBase }));
    });
  }, [flavours, defaultBase]);

  const addFlavour = () => {
    const val = newFlavour.trim();
    if (!val || flavours.some((f) => f.toLowerCase() === val.toLowerCase())) { setNewFlavour(""); return; }
    setFlavours((prev) => [...prev, val]);
    setNewFlavour("");
  };

  const removeFlavour = (idx: number) => {
    const name = flavours[idx];
    setFlavours((prev) => prev.filter((_, i) => i !== idx));
    setFlavourPrices((prev) => prev.filter((fp) => fp.name !== name));
  };

  const updatePrice = (name: string, price: number) => {
    setFlavourPrices((prev) => prev.map((fp) => (fp.name === name ? { ...fp, price500g: price } : fp)));
  };

  const setAllPrices = () => {
    setFlavourPrices((prev) => prev.map((fp) => ({ ...fp, price500g: defaultBase })));
  };

  const addSize = () => {
    const last = customSizes.length > 0 ? customSizes[customSizes.length - 1].kg : 0;
    setCustomSizes([...customSizes, { kg: last + 1, name: `${last + 1} Kg`, serves: "" }]);
  };

  const removeSize = (idx: number) => setCustomSizes(customSizes.filter((_, i) => i !== idx));
  const updateSize = (idx: number, field: keyof CustomSize, value: string | number) => {
    setCustomSizes(customSizes.map((s, i) => {
      if (i !== idx) return s;
      if (field === "kg") {
        const kg = Number(value);
        return { ...s, kg, name: `${kg} Kg` };
      }
      return { ...s, [field]: value };
    }));
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      await fetch("/api/admin/flavours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flavours, flavourPrices, customSizes: customSizes.sort((a, b) => a.kg - b.kg), defaultBase500gPrice: defaultBase }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold font-serif text-foreground">Flavours & Pricing</h1>
          <p className="text-xs text-muted-foreground">Global flavour list, prices, and custom sizes for calculated pricing</p>
        </div>
      </div>

      {/* Section 1: Flavour List + Prices */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4 mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground font-serif">Flavours & Default Prices</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">These prices are used as defaults when adding products with Custom pricing strategy</p>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-foreground block mb-1">Default 500g Price (₹)</label>
            <input type="number" min={0} step={10} value={defaultBase} onChange={(e) => setDefaultBase(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <button onClick={setAllPrices} className="px-3 py-2.5 text-xs text-primary font-semibold bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors whitespace-nowrap">
            Apply to All
          </button>
        </div>

        <div className="flex gap-2">
          <input type="text" value={newFlavour} onChange={(e) => setNewFlavour(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFlavour()} placeholder="Add a new flavour..."
            className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          <button onClick={addFlavour} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2 bg-muted/50 border-b border-border grid grid-cols-[1fr_100px_32px] gap-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            <span>Flavour</span>
            <span className="text-right">₹/500g</span>
            <span></span>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {flavourPrices.map((fp, idx) => (
              <div key={fp.name} className="grid grid-cols-[1fr_100px_32px] gap-2 items-center px-4 py-2 hover:bg-muted/20 transition-colors group">
                <span className="text-sm font-medium text-foreground truncate">{fp.name}</span>
                <input type="number" min={0} step={10} value={fp.price500g}
                  onChange={(e) => updatePrice(fp.name, Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-2 py-1.5 border border-border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <button onClick={() => removeFlavour(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center no-min-touch">
                  <X className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 bg-muted/30 border-t border-border text-[10px] text-muted-foreground">
            {flavourPrices.length} flavours · Cheapest: ₹{flavourPrices.length > 0 ? Math.min(...flavourPrices.map(fp => fp.price500g)) : 0}/500g
          </div>
        </div>
      </div>

      {/* Section 2: Custom Sizes */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground font-serif">Custom Pricing Sizes</h2>
          </div>
          <button onClick={addSize} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline no-min-touch">
            <Plus className="w-3 h-3" /> Add Size
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">These sizes appear for products using Custom pricing. Editable per product too.</p>

        <div className="space-y-2">
          <div className="grid grid-cols-[80px_1fr_1fr_32px] gap-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-1">
            <span>Weight (kg)</span>
            <span>Label</span>
            <span>Serves</span>
            <span></span>
          </div>
          {customSizes.sort((a, b) => a.kg - b.kg).map((size, idx) => (
            <div key={idx} className="grid grid-cols-[80px_1fr_1fr_32px] gap-2 items-center">
              <input type="number" min={0.25} step={0.25} value={size.kg}
                onChange={(e) => updateSize(idx, "kg", e.target.value)}
                className="px-2 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input type="text" value={size.name}
                onChange={(e) => updateSize(idx, "name", e.target.value)}
                className="px-2 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input type="text" value={size.serves} placeholder="e.g., Serves 8-10"
                onChange={(e) => updateSize(idx, "serves", e.target.value)}
                className="px-2 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button onClick={() => removeSize(idx)} className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center no-min-touch">
                <X className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : saved ? <><Save className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save All</>}
      </button>
    </div>
  );
}
