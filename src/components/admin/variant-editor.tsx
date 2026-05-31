"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Variant {
  id?: string;
  name: string;
  price: number;
}

interface Props {
  defaultVariants?: Variant[];
}

export function VariantEditor({ defaultVariants = [] }: Props) {
  const [variants, setVariants] = useState<Variant[]>(defaultVariants);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const addVariant = () => {
    const trimmed = name.trim();
    const p = parseFloat(price);
    if (!trimmed || isNaN(p) || p <= 0) return;
    setVariants([...variants, { name: trimmed, price: p }]);
    setName("");
    setPrice("");
  };

  const removeVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
      <h2 className="font-semibold text-foreground font-serif">Size / Weight Variants</h2>
      <p className="text-xs text-muted-foreground -mt-2">
        Add different sizes like 0.5 kg, 1 kg, 2 kg with their prices. The base price above is used when no variants exist.
      </p>

      {/* Existing variants */}
      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((v, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-2.5">
              <span className="flex-1 text-sm font-medium text-foreground">{v.name}</span>
              <span className="text-sm font-bold text-primary">₹{v.price}</span>
              <button
                type="button"
                onClick={() => removeVariant(idx)}
                className="text-destructive hover:bg-red-50 p-1 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new variant */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Size Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., 0.5 kg"
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVariant())}
          />
        </div>
        <div className="w-28">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Price (₹)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            step="1"
            min="1"
            placeholder="450"
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVariant())}
          />
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="px-3 py-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors flex items-center gap-1 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Size
        </button>
      </div>

      {/* Hidden input to pass variants as JSON */}
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
    </div>
  );
}
