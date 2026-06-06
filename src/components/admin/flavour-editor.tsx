"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X, Settings } from "lucide-react";
import Link from "next/link";

interface Props {
  defaultFlavours?: string[];
}

const FALLBACK_FLAVOURS = [
  "Chocolate", "Vanilla", "Butterscotch", "Black Forest", "Red Velvet",
  "Pineapple", "Strawberry", "Mango", "Blueberry",
];

export function FlavourEditor({ defaultFlavours = [] }: Props) {
  const [flavours, setFlavours] = useState<string[]>(defaultFlavours);
  const [customInput, setCustomInput] = useState("");
  const [commonFlavours, setCommonFlavours] = useState<string[]>(FALLBACK_FLAVOURS);

  // Fetch default flavours from store settings
  useEffect(() => {
    fetch("/api/admin/flavours")
      .then((r) => r.json())
      .then((data) => {
        if (data.flavours && data.flavours.length > 0) {
          setCommonFlavours(data.flavours);
        }
      })
      .catch(() => {});
  }, []);

  const normalizedSet = useMemo(
    () => new Set(flavours.map((item) => item.trim().toLowerCase())),
    [flavours]
  );

  const toggleCommonFlavour = (flavour: string) => {
    const key = flavour.toLowerCase();
    if (normalizedSet.has(key)) {
      setFlavours((prev) => prev.filter((item) => item.trim().toLowerCase() !== key));
      return;
    }
    setFlavours((prev) => [...prev, flavour]);
  };

  const addCustomFlavour = () => {
    const value = customInput.trim();
    if (!value) return;

    const key = value.toLowerCase();
    if (normalizedSet.has(key)) {
      setCustomInput("");
      return;
    }

    setFlavours((prev) => [...prev, value]);
    setCustomInput("");
  };

  const removeFlavour = (name: string) => {
    const key = name.toLowerCase();
    setFlavours((prev) => prev.filter((item) => item.toLowerCase() !== key));
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground font-serif">Flavours</h2>
          <p className="text-[11px] text-muted-foreground">Choose common flavours quickly, and add custom flavours when needed.</p>
        </div>
        {flavours.length > 0 && (
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
            {flavours.length} selected
          </span>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-foreground">Common Flavours</p>
            <Link href="/admin/flavours" className="text-[10px] text-primary/60 hover:text-primary flex items-center gap-0.5 no-min-touch"><Settings className="w-3 h-3" /> Manage</Link>
          </div>
          <button
            type="button"
            onClick={() => {
              if (flavours.length === commonFlavours.length) {
                setFlavours([]);
              } else {
                setFlavours([...commonFlavours]);
              }
            }}
            className="text-[11px] text-primary font-semibold hover:underline no-min-touch"
          >
            {flavours.length === commonFlavours.length ? "Deselect All" : "Select All"}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {commonFlavours.map((flavour) => {
            const checked = normalizedSet.has(flavour.toLowerCase());
            return (
              <label
                key={flavour}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition-colors ${
                  checked
                    ? "border-primary bg-primary/5"
                    : "border-border bg-white hover:border-primary/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCommonFlavour(flavour)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-foreground">{flavour}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground mb-2">Add Custom Flavour</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomFlavour();
              }
            }}
            placeholder="e.g., Rasmalai, Lotus Biscoff"
            className="flex-1 px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={addCustomFlavour}
            disabled={!customInput.trim()}
            className="px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {flavours.length > 0 && (
        <div>
          <p className="text-xs font-medium text-foreground mb-2">Selected Flavours</p>
          <div className="flex flex-wrap gap-2">
            {flavours.map((flavour) => (
              <span key={flavour} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                {flavour}
                <button type="button" onClick={() => removeFlavour(flavour)} className="hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <input type="hidden" name="flavours" value={JSON.stringify(flavours)} />
    </div>
  );
}
