"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface Props {
  defaultFlavours?: string[];
}

export function FlavourEditor({ defaultFlavours = [] }: Props) {
  const [flavours, setFlavours] = useState<string[]>(defaultFlavours);
  const [input, setInput] = useState("");

  const addFlavour = () => {
    const val = input.trim();
    if (val && !flavours.includes(val)) {
      setFlavours([...flavours, val]);
      setInput("");
    }
  };

  const removeFlavour = (f: string) => {
    setFlavours(flavours.filter(x => x !== f));
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground font-serif">Flavours</h2>
          <p className="text-[10px] text-muted-foreground">Optional. Add available flavour options for this product.</p>
        </div>
        {flavours.length > 0 && (
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
            {flavours.length} flavour{flavours.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Current flavours as chips */}
      {flavours.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {flavours.map((f) => (
            <span key={f} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
              {f}
              <button type="button" onClick={() => removeFlavour(f)} className="hover:text-destructive transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFlavour(); } }}
          placeholder="e.g., Chocolate, Vanilla, Red Velvet..."
          className="flex-1 px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={addFlavour}
          disabled={!input.trim()}
          className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-30"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <input type="hidden" name="flavours" value={JSON.stringify(flavours)} />
    </div>
  );
}
