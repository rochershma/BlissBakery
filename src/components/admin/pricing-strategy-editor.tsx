"use client";

import { useEffect, useState } from "react";
import { Calculator, DollarSign } from "lucide-react";

interface FlavourPrice {
  name: string;
  price500g: number;
}

interface Props {
  defaultStrategy?: "FIXED" | "CUSTOM";
  defaultDesignCharge?: number;
  defaultBase500gPrice?: number;
  defaultFlavourPrices?: FlavourPrice[];
  defaultBasePrice?: number;
  flavours?: string[]; // from FlavourEditor
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
  flavours = [],
}: Props) {
  const [strategy, setStrategy] = useState<"FIXED" | "CUSTOM">(defaultStrategy);
  const [designCharge, setDesignCharge] = useState(defaultDesignCharge);
  const [base500gPrice, setBase500gPrice] = useState(defaultBase500gPrice);
  const [flavourPrices, setFlavourPrices] = useState<FlavourPrice[]>(defaultFlavourPrices);
  const [globalDefault, setGlobalDefault] = useState(300);

  // Fetch global default base price
  useEffect(() => {
    fetch("/api/admin/delivery-config")
      .then((r) => r.json())
      .then((data) => {
        // We'll add defaultBase500gPrice to this API later
      })
      .catch(() => {});
  }, []);

  // Sync flavour prices when flavours list changes (from FlavourEditor)
  useEffect(() => {
    if (strategy !== "CUSTOM" || flavours.length === 0) return;

    // Listen for flavours hidden input changes
    const observer = new MutationObserver(() => {
      const input = document.querySelector('input[name="flavours"]') as HTMLInputElement;
      if (!input) return;
      try {
        const currentFlavours: string[] = JSON.parse(input.value || "[]");
        setFlavourPrices((prev) => {
          const existing = new Map(prev.map((fp) => [fp.name, fp.price500g]));
          return currentFlavours.map((f) => ({
            name: f,
            price500g: existing.get(f) ?? base500gPrice,
          }));
        });
      } catch {}
    });

    const input = document.querySelector('input[name="flavours"]');
    if (input) {
      observer.observe(input, { attributes: true, attributeFilter: ["value"] });
      // Initial sync
      try {
        const currentFlavours: string[] = JSON.parse((input as HTMLInputElement).value || "[]");
        setFlavourPrices((prev) => {
          const existing = new Map(prev.map((fp) => [fp.name, fp.price500g]));
          return currentFlavours.map((f) => ({
            name: f,
            price500g: existing.get(f) ?? base500gPrice,
          }));
        });
      } catch {}
    }

    return () => observer.disconnect();
  }, [strategy, base500gPrice, flavours]);

  // Auto-sync flavour prices when flavours prop changes
  useEffect(() => {
    if (strategy !== "CUSTOM" || flavours.length === 0) return;
    setFlavourPrices((prev) => {
      const existing = new Map(prev.map((fp) => [fp.name, fp.price500g]));
      return flavours.map((f) => ({
        name: f,
        price500g: existing.get(f) ?? base500gPrice,
      }));
    });
  }, [flavours, strategy, base500gPrice]);

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
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Design / Customization Charge (₹)</label>
            <input
              type="number" min={0} step={10} value={designCharge}
              onChange={(e) => setDesignCharge(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Fixed charge added to every size for design work</p>
          </div>

          {/* Base 500g Price */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Default Base Price per 500g (₹)</label>
            <div className="flex gap-2">
              <input
                type="number" min={0} step={10} value={base500gPrice}
                onChange={(e) => setBase500gPrice(Math.max(0, parseFloat(e.target.value) || 0))}
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
                        type="number" min={0} step={10} value={fp.price500g}
                        onChange={(e) => updateFlavourPrice(fp.name, Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-20 px-2 py-1.5 border border-border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Preview */}
          <div className="bg-muted/50 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-foreground">Price Preview (cheapest flavour ₹{cheapestFlavour}/500g)</p>
            {WEIGHT_OPTIONS.map((w) => (
              <div key={w.name} className="flex justify-between text-xs text-muted-foreground">
                <span>{w.name}</span>
                <span className="font-semibold text-foreground">₹{calculateCustomPrice(cheapestFlavour, w.kg, designCharge)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="pricingStrategy" value={strategy} />
      <input type="hidden" name="designCharge" value={designCharge} />
      <input type="hidden" name="base500gPrice" value={base500gPrice} />
      <input type="hidden" name="flavourPrices" value={JSON.stringify(flavourPrices)} />
    </div>
  );
}
