"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Variant {
  id?: string;
  name: string;
  price: number;
  serves?: string;
}

interface Props {
  defaultVariants?: Variant[];
}

const COMMON_SIZES_KG = [
  { name: "0.5 Kg", serves: "Serves 4-6" },
  { name: "1 Kg", serves: "Serves 8-10" },
  { name: "1.5 Kg", serves: "Serves 12-15" },
  { name: "2 Kg", serves: "Serves 18-20" },
  { name: "2.5 Kg", serves: "Serves 22-25" },
  { name: "3 Kg", serves: "Serves 25-30" },
  { name: "4 Kg", serves: "Serves 35-40" },
  { name: "5 Kg", serves: "Serves 45-50" },
  { name: "6 Kg", serves: "Serves 55-60" },
];

const COMMON_SIZES_POUND: { name: string; serves: string }[] = [];

export function VariantEditor({ defaultVariants = [] }: Props) {
  const [variants, setVariants] = useState<Variant[]>(defaultVariants);
  const [name, setName] = useState("");
  const [serves, setServes] = useState("");
  const [price, setPrice] = useState("");

  const addVariant = () => {
    const trimmedName = name.trim();
    const trimmedServes = serves.trim();
    const parsedPrice = parseFloat(price);

    if (!trimmedName || Number.isNaN(parsedPrice) || parsedPrice <= 0) return;

    setVariants((prev) => [
      ...prev,
      {
        name: trimmedName,
        serves: trimmedServes,
        price: parsedPrice,
      },
    ]);

    setName("");
    setServes("");
    setPrice("");
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, updates: Partial<Variant>) => {
    setVariants((prev) => prev.map((variant, i) => (i === index ? { ...variant, ...updates } : variant)));
  };

  const setPreset = (preset: { name: string; serves: string }) => {
    setName(preset.name);
    setServes(preset.serves);
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
      <h2 className="font-semibold text-foreground font-serif">Size / Weight Variants</h2>
      <p className="text-xs text-muted-foreground -mt-2">
        Add common kg/pound sizes quickly, set price, and attach serving info for each size.
      </p>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground">Common Size Presets</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_SIZES_KG.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => setPreset(preset)}
              className="px-3 py-1.5 rounded-full border border-border text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {COMMON_SIZES_POUND.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => setPreset(preset)}
              className="px-3 py-1.5 rounded-full border border-border text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-2 items-end">
        <div className="md:col-span-4">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Size</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., 20 Pound"
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVariant())}
          />
        </div>

        <div className="md:col-span-4">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Serving Size</label>
          <input
            value={serves}
            onChange={(e) => setServes(e.target.value)}
            placeholder="e.g., Serves 8-10 people"
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVariant())}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Price (₹)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="text"
            inputMode="numeric"
            placeholder="550"
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVariant())}
          />
        </div>

        <button
          type="button"
          onClick={addVariant}
          className="md:col-span-2 px-3 py-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Size
        </button>
      </div>

      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div key={`${variant.id || "new"}-${index}`} className="grid md:grid-cols-12 gap-2 items-center rounded-xl border border-border p-2.5 bg-muted/30">
              <input
                className="md:col-span-4 px-3 py-2 border border-border rounded-lg text-sm"
                value={variant.name}
                onChange={(e) => updateVariant(index, { name: e.target.value })}
              />
              <input
                className="md:col-span-4 px-3 py-2 border border-border rounded-lg text-sm"
                value={variant.serves || ""}
                onChange={(e) => updateVariant(index, { serves: e.target.value })}
                placeholder="Serving size"
              />
              <input
                className="md:col-span-2 px-3 py-2 border border-border rounded-lg text-sm"
                type="text"
                inputMode="numeric"
                value={variant.price || ''}
                onChange={(e) => updateVariant(index, { price: Number(e.target.value) || 0 })}
              />
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="md:col-span-2 p-2 rounded-lg text-destructive hover:bg-red-50 transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
    </div>
  );
}
