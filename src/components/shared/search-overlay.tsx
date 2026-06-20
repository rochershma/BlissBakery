"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  image: string | null;
  categoryName: string;
}

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 300);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white md:bg-black/40 md:backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full h-full md:h-auto md:max-w-lg md:mx-auto md:mt-16 md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-pink-100/60" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
          <Search className="w-5 h-5 text-primary/50 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search cakes, pastries, flavours..."
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            className="flex-1 text-[15px] font-medium outline-none bg-transparent placeholder:text-muted-foreground/50"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="p-1.5 rounded-full bg-pink-50 hover:bg-pink-100 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </button>
          )}
          <button onClick={onClose} className="text-xs text-primary font-bold hover:text-primary-hover ml-1">
            Cancel
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5 text-primary/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try a different keyword</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1.5 text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((r) => (
                <Link
                  key={r.id}
                  href={`/store/kuchaman-city/menu/${r.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-pink-50/50 active:bg-pink-50 transition-colors border-b border-pink-50/80 last:border-0"
                >
                  {r.image ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative bg-pink-50">
                      <Image src={r.image} alt={r.name} fill className="object-cover" sizes="56px" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary/30 text-lg font-bold">?</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-foreground truncate">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{r.categoryName}</p>
                  </div>
                  <span className="text-sm font-black text-primary flex-shrink-0">{formatPrice(r.basePrice)}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Quick links when empty */}
          {!loading && query.length < 2 && (
            <div className="py-5 px-4">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {["Chocolate", "Red Velvet", "Butterscotch", "Birthday", "Anniversary", "KitKat", "Groom", "Pastries", "Brownies"].map((term) => (
                  <button
                    key={term}
                    onClick={() => handleChange(term)}
                    className="px-3.5 py-2 bg-pink-50 rounded-2xl text-[11px] font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-pink-100/60"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
