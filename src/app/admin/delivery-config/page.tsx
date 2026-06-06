"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Save, Loader2, Truck, Percent, Package } from "lucide-react";

interface Tier {
  maxKm: number;
  fee: number;
}

export default function AdminDeliveryConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [gstRate, setGstRate] = useState(0);
  const [packagingCharge, setPackagingCharge] = useState(15);
  const [deliveryCharge, setDeliveryCharge] = useState(30);
  const [minDeliveryOrder, setMinDeliveryOrder] = useState(200);
  const [tiers, setTiers] = useState<Tier[]>([
    { maxKm: 3, fee: 0 },
    { maxKm: 6, fee: 30 },
    { maxKm: 10, fee: 50 },
  ]);

  useEffect(() => {
    fetch("/api/admin/delivery-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.gstRate !== undefined) setGstRate(data.gstRate);
        if (data.packagingCharge !== undefined) setPackagingCharge(data.packagingCharge);
        if (data.deliveryCharge !== undefined) setDeliveryCharge(data.deliveryCharge);
        if (data.minDeliveryOrder !== undefined) setMinDeliveryOrder(data.minDeliveryOrder);
        if (data.deliveryTiers) setTiers(data.deliveryTiers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addTier = () => {
    const lastMax = tiers.length > 0 ? tiers[tiers.length - 1].maxKm : 0;
    setTiers([...tiers, { maxKm: lastMax + 5, fee: 0 }]);
  };

  const removeTier = (idx: number) => {
    setTiers(tiers.filter((_, i) => i !== idx));
  };

  const updateTier = (idx: number, field: "maxKm" | "fee", value: number) => {
    setTiers(tiers.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/admin/delivery-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gstRate,
          packagingCharge,
          deliveryCharge,
          minDeliveryOrder,
          deliveryTiers: tiers.sort((a, b) => a.maxKm - b.maxKm),
        }),
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
        <Link href="/admin" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold font-serif text-foreground">Delivery & Charges</h1>
          <p className="text-xs text-muted-foreground">Configure GST, packaging, and delivery fees</p>
        </div>
      </div>

      {/* GST & Packaging */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4 mb-4">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground font-serif">Tax & Packaging</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">GST Rate (%)</label>
            <input type="number" min={0} max={28} step={0.1} value={gstRate}
              onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <p className="text-[10px] text-muted-foreground mt-1">Set to 0 to disable GST</p>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Packaging Charge (₹)</label>
            <input type="number" min={0} step={1} value={packagingCharge}
              onChange={(e) => setPackagingCharge(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </div>

      {/* Delivery Settings */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4 mb-4">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground font-serif">Delivery Settings</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Default Delivery Fee (₹)</label>
            <input type="number" min={0} step={1} value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <p className="text-[10px] text-muted-foreground mt-1">Fallback when no tiers match</p>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Min Order for Delivery (₹)</label>
            <input type="number" min={0} step={10} value={minDeliveryOrder}
              onChange={(e) => setMinDeliveryOrder(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
      </div>

      {/* Distance-Based Delivery Tiers */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground font-serif">Distance-Based Fees</h2>
          </div>
          <button onClick={addTier} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline no-min-touch">
            <Plus className="w-3 h-3" /> Add Tier
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">Orders beyond the last tier are marked as not serviceable</p>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_40px] gap-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-1">
            <span>Up to (km)</span>
            <span>Fee (₹)</span>
            <span></span>
          </div>
          {tiers.map((tier, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
              <input type="number" min={0} step={0.5} value={tier.maxKm}
                onChange={(e) => updateTier(idx, "maxKm", parseFloat(e.target.value) || 0)}
                className="px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <input type="number" min={0} step={5} value={tier.fee}
                onChange={(e) => updateTier(idx, "fee", parseFloat(e.target.value) || 0)}
                className="px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button onClick={() => removeTier(idx)} className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center no-min-touch">
                <X className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          ))}
        </div>

        {tiers.length > 0 && (
          <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Preview:</p>
            {tiers.sort((a, b) => a.maxKm - b.maxKm).map((t, i) => (
              <p key={i}>
                {i === 0 ? `0` : tiers[i - 1].maxKm} – {t.maxKm} km → {t.fee === 0 ? "Free delivery" : `₹${t.fee}`}
              </p>
            ))}
            <p className="text-destructive">{`> ${tiers[tiers.length - 1].maxKm} km → Not serviceable`}</p>
          </div>
        )}
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : saved ? <><Save className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Configuration</>}
      </button>
    </div>
  );
}
