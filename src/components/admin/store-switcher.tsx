"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown, Check, Store as StoreIcon } from "lucide-react";
import type { AdminStore } from "@/lib/active-store";

export function StoreSwitcher({
  stores,
  active,
  onSelect,
  compact = false,
}: {
  stores: AdminStore[];
  active: AdminStore | null;
  onSelect: (formData: FormData) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!active) return null;

  const only = stores.length <= 1;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !only && setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Switch store"
        disabled={only}
        className={`flex w-full items-center gap-2 rounded-xl border border-border bg-white text-left transition-colors ${
          compact ? "px-2.5 py-1.5" : "px-3 py-2.5"
        } ${only ? "cursor-default" : "hover:border-primary/40"}`}
      >
        <StoreIcon className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} text-primary flex-shrink-0`} />
        <span className="flex-1 min-w-0">
          {!compact ? (
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Store</span>
          ) : null}
          <span className={`block truncate font-medium text-foreground ${compact ? "text-xs" : "text-sm"}`}>
            {active.name}
          </span>
        </span>
        {!only ? <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : null}
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-50 mt-1 min-w-[220px] rounded-xl border border-border bg-white p-1 shadow-lg">
          {stores.map((s) => (
            <form action={onSelect} key={s.id}>
              <input type="hidden" name="storeId" value={s.id} />
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-primary/5"
              >
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{s.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {[s.city, s.pincode].filter(Boolean).join(" · ")}
                    {s.isOpen ? "" : " · closed"}
                  </span>
                </span>
                {s.id === active.id ? <Check className="w-4 h-4 text-primary flex-shrink-0" /> : null}
              </button>
            </form>
          ))}
        </div>
      ) : null}
    </div>
  );
}
