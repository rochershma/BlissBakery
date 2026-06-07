"use client";

import { useEffect, useState } from "react";
import { Calculator, DollarSign, Plus, X } from "lucide-react";

interface FlavourPrice {
  name: string;
  price500g: number;
}

interface CustomSize {
  kg: number;
  name: string;
  serves: string;
  enabled: boolean;
}

interface Props {
  defaultStrategy?: "FIXED" | "CUSTOM";
  defaultDesignCharge?: number;
  defaultBase500gPrice?: number;
  defaultFlavourPrices?: FlavourPrice[];
  defaultBasePrice?: number;
  defaultFlavour?: string;
  defaultDiscountPct?: number;
  defaultCustomSizes?: CustomSize[];
  flavours?: string[];
}

const WEIGHT_OPTIONS = [
  { name: "0.5 Kg", kg: 0.5, serves: "Serves 4-6" },
  { name: "1 Kg", kg: 1, serves: "Serves 8-10" },
  { name: "1.5 Kg", kg: 1.5, serves: "Serves 12-15" },
  { name: "2 Kg", kg: 2, serves: "Serves 18-20" },
  { name: "2.5 Kg", kg: 2.5, serves: "Serves 22-25" },
  { name: "3 Kg", kg: 3, serves: "Serves 28-30" },
];

export function calculateCustomPrice(flavour500gPrice: number, weightKg: number, designCharge: number): number {
  return Math.round(flavour500gPrice * weightKg * 2 + designCharge);
}

export function PricingStrategyEditor({
  defaultStrategy = "FIXED",
  defaultDesignCharge = 0,
  defaultBase500gPrice = 300,
  defaultFlavourPrices = [],
  defaultBasePrice = 0,
  defaultFlavour = "",
  defaultDiscountPct = 0,
  defaultCustomSizes,
  flavours = [],
}: Props) {
  const [strategy, setStrategy] = useState<"FIXED" | "CUSTOM">(defaultStrategy);
  const [designCharge, setDesignCharge] = useState(defaultDesignCharge);
  const [base500gPrice, setBase500gPrice] = useState(defaultBase500gPrice);
  const [flavourPrices, setFlavourPrices] = useState<FlavourPrice[]>(defaultFlavourPrices);
  const [selectedDefault, setSelectedDefault] = useState(defaultFlavour);
  const [discountPct, setDiscountPct] = useState(defaultDiscountPct);
  const [customSizes, setCustomSizes] = useState<CustomSize[]>(
    defaultCustomSizes || WEIGHT_OPTIONS.map(w => ({ ...w, enabled: true }))
  );

  // Fetch global default base price — not needed for now

  // Fetch global flavour prices and custom sizes
  useEffect(() => {
    if (strategy !== "CUSTOM") return;
    fetch("/api/admin/flavours")
      .then((r) => r.json())
      .then((data) => {
        // Load global flavour prices as defaults if product has none
        if (data.flavourPrices?.length > 0 && flavourPrices.length === 0 && flavours.length > 0) {
          const globalMap = new Map(data.flavourPrices.map((fp: { name: string; price500g: number }) => [fp.name, fp.price500g]));
          setFlavourPrices(flavours.map((f) => ({
            name: f,
            price500g: globalMap.get(f) ?? (data.defaultBase500gPrice || base500gPrice),
          })));
        }
        if (data.defaultBase500gPrice && base500gPrice === 300) {
          setBase500gPrice(data.defaultBase500gPrice);
        }
        // Load global sizes if no product-level sizes set
        if (data.customSizes?.length > 0 && !defaultCustomSizes) {
          setCustomSizes(data.customSizes.map((s: { kg: number; name: string; serves: string }) => ({ ...s, enabled: true })));
        }
      })
      .catch(() => {});
  }, [strategy]);

  // Sync flavour prices when flavours change (via custom event from FlavourEditor)
  useEffect(() => {
    if (strategy !== "CUSTOM") return;

    const handleFlavoursChanged = (e: Event) => {
      const currentFlavours = (e as CustomEvent<string[]>).detail;
      if (!currentFlavours || currentFlavours.length === 0) return;

      // Fetch global prices to use as defaults
      fetch("/api/admin/flavours").then(r => r.json()).then(data => {
        const globalMap = new Map<string, number>((data.flavourPrices || []).map((fp: { name: string; price500g: number }) => [fp.name, fp.price500g]));
        setFlavourPrices((prev) => {
          const existing = new Map<string, number>(prev.map((fp) => [fp.name, fp.price500g]));
          return currentFlavours.map((f) => ({
            name: f,
            price500g: existing.get(f) ?? globalMap.get(f) ?? base500gPrice,
          }));
        });
      }).catch(() => {
        setFlavourPrices((prev) => {
          const existing = new Map<string, number>(prev.map((fp) => [fp.name, fp.price500g]));
          return currentFlavours.map((f) => ({
            name: f,
            price500g: existing.get(f) ?? base500gPrice,
          }));
        });
      });
    };

    window.addEventListener("flavours-changed", handleFlavoursChanged);
    return () => window.removeEventListener("flavours-changed", handleFlavoursChanged);
  }, [strategy, base500gPrice]);

  const updateFlavourPrice = (name: string, price: number) => {
    setFlavourPrices((prev) => prev.map((fp) => (fp.name === name ? { ...fp, price500g: price } : fp)));
  };

  const setAllToBase = () => {
    setFlavourPrices((prev) => prev.map((fp) => ({ ...fp, price500g: base500gPrice })));
  };

  // Calculate preview prices
  const cheapestFlavour = flavourPrices.length > 0 ? Math.min(...flavourPrices.map((fp) => fp.price500g)) : base500gPrice;

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-foreground font-serif">Pricing Strategy</h2>
        <p className="text-[11px] text-muted-foreground">Choose how this product is priced</p>
      </div>

      {/* Strategy Toggle */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStrategy("FIXED")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
            strategy === "FIXED" ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary/40"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Fixed Price
        </button>
        <button
          type="button"
          onClick={() => setStrategy("CUSTOM")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
            strategy === "CUSTOM" ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary/40"
          }`}
        >
          <Calculator className="w-4 h-4" />
          Custom (Calculated)
        </button>
      </div>

      {strategy === "FIXED" && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          Set prices manually for each variant below. Customer sees exactly what you set.
        </p>
      )}

      {strategy === "CUSTOM" && (
        <>
          <p className="text-xs text-muted-foreground bg-blue-50 text-blue-700 rounded-lg px-3 py-2 border border-blue-200">
            Price = (Flavour 500g price x Weight x 2) + Design charge. Price updates automatically when customer picks a flavour.
          </p>

          {/* Design Charge */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Design / Customization Charge (₹)</label>
              <input
                type="text" inputMode="numeric" value={designCharge || ''}
                onChange={(e) => setDesignCharge(parseFloat(e.target.value) || 0)}
                onBlur={(e) => setDesignCharge(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Discount % (strikethrough)</label>
              <input
                type="text" inputMode="numeric" value={discountPct || ''}
                onChange={(e) => setDiscountPct(parseFloat(e.target.value) || 0)}
                onBlur={(e) => setDiscountPct(Math.max(0, Math.min(90, parseFloat(e.target.value) || 0)))}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[10px] text-muted-foreground mt-1">0 = no discount. Shows original as strikethrough.</p>
            </div>
          </div>

          {/* Base 500g Price */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Default Base Price per 500g (₹)</label>
            <div className="flex gap-2">
              <input
                type="text" inputMode="numeric" value={base500gPrice || ''}
                onChange={(e) => setBase500gPrice(parseFloat(e.target.value) || 0)}
                onBlur={(e) => setBase500gPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button type="button" onClick={setAllToBase} className="px-3 py-2.5 text-xs text-primary font-semibold bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors whitespace-nowrap">
                Apply to All
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Default price for flavours not individually priced</p>
          </div>

          {/* Per-Flavour Prices */}
          {flavourPrices.length > 0 && (
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">Flavour Prices (per 500g)</label>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {flavourPrices.map((fp) => (
                  <div key={fp.name} className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-foreground truncate">{fp.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">₹</span>
                      <input
                        type="text" inputMode="numeric" value={fp.price500g || ''}
                        onChange={(e) => updateFlavourPrice(fp.name, parseFloat(e.target.value) || 0)}
                        onBlur={(e) => updateFlavourPrice(fp.name, Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-20 px-2 py-1.5 border border-border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default Flavour */}
          {flavourPrices.length > 0 && (
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Default Flavour (shown first to customer)</label>
              <select
                value={selectedDefault}
                onChange={(e) => setSelectedDefault(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                <option value="">Auto (cheapest)</option>
                {flavourPrices.map((fp) => (
                  <option key={fp.name} value={fp.name}>{fp.name} — ₹{fp.price500g}/500g</option>
                ))}
              </select>
            </div>
          )}

          {/* Sizes for this product */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-foreground">Sizes for this product</label>
              <button type="button" onClick={() => setCustomSizes(prev => [...prev, { kg: prev.length > 0 ? prev[prev.length-1].kg + 0.5 : 0.5, name: "", serves: "", enabled: true }])}
                className="text-[10px] text-primary font-semibold flex items-center gap-0.5 no-min-touch hover:underline">
                <Plus className="w-3 h-3" /> Add Size
              </button>
            </div>
            <div className="space-y-1.5">
              {customSizes.map((size, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="checkbox" checked={size.enabled} onChange={(e) => {
                    const updated = [...customSizes]; updated[idx] = { ...updated[idx], enabled: e.target.checked }; setCustomSizes(updated);
                  }} className="w-4 h-4 accent-primary flex-shrink-0" />
                  <input type="text" inputMode="decimal" value={size.kg || ''} onChange={(e) => {
                    const updated = [...customSizes]; const kg = parseFloat(e.target.value) || 0;
                    updated[idx] = { ...updated[idx], kg, name: kg ? `${kg} Kg` : '' }; setCustomSizes(updated);
                  }} className="w-16 px-2 py-1.5 border border-border rounded-lg text-xs text-center" placeholder="kg" />
                  <span className="text-xs text-muted-foreground flex-shrink-0">{size.name || `${size.kg} Kg`}</span>
                  <input type="text" value={size.serves} onChange={(e) => {
                    const updated = [...customSizes]; updated[idx] = { ...updated[idx], serves: e.target.value }; setCustomSizes(updated);
                  }} className="flex-1 px-2 py-1.5 border border-border rounded-lg text-xs" placeholder="Serves 8-10" />
                  <button type="button" onClick={() => setCustomSizes(customSizes.filter((_, i) => i !== idx))} className="no-min-touch">
                    <X className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Price Preview — show ALL flavours with prices for enabled sizes */}
          {(() => { const enabledSizes = customSizes.filter(s => s.enabled).sort((a, b) => a.kg - b.kg); return (
          <div className="bg-muted/50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">Price Preview</p>
            {flavourPrices.length > 0 && enabledSizes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground">
                      <td className="py-1 pr-2 font-semibold">Flavour</td>
                      {enabledSizes.slice(0, 5).map((w) => (
                        <td key={w.kg} className="py-1 px-1 text-right font-semibold">{w.name || `${w.kg} Kg`}</td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {flavourPrices.slice(0, 5).map((fp) => (
                      <tr key={fp.name} className="border-t border-border/30">
                        <td className="py-1 pr-2 text-foreground truncate max-w-[100px]">{fp.name}</td>
                        {enabledSizes.slice(0, 5).map((w) => (
                          <td key={w.kg} className="py-1 px-1 text-right font-semibold text-foreground">₹{calculateCustomPrice(fp.price500g, w.kg, designCharge)}</td>
                        ))}
                      </tr>
                    ))}
                    {flavourPrices.length > 5 && (
                      <tr><td colSpan={enabledSizes.length + 1} className="py-1 text-muted-foreground">...and {flavourPrices.length - 5} more</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Add flavours and enable sizes to see preview</p>
            )}
          </div>
          ); })()}
        </>
      )}

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="pricingStrategy" value={strategy} />
      <input type="hidden" name="designCharge" value={designCharge} />
      <input type="hidden" name="base500gPrice" value={base500gPrice} />
      <input type="hidden" name="flavourPrices" value={JSON.stringify(flavourPrices)} />
      <input type="hidden" name="defaultFlavour" value={selectedDefault} />
      <input type="hidden" name="discountPct" value={discountPct} />
      <input type="hidden" name="customSizes" value={JSON.stringify(customSizes.filter(s => s.enabled).sort((a, b) => a.kg - b.kg))} />

      {/* Hide variants + base price sections when Custom is selected */}
      {strategy === "CUSTOM" && (
        <style dangerouslySetInnerHTML={{ __html: `
          [data-section="variants"], [data-section="base-price"] { display: none !important; }
        ` }} />
      )}
    </div>
  );
}
