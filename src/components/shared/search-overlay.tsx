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
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg mx-auto mt-0 md:mt-16 md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search cakes, pastries, flavours..."
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            className="flex-1 text-base outline-none bg-transparent placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="p-1 rounded-full hover:bg-muted">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground font-medium">
            Cancel
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] md:max-h-[50vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((r) => (
                <Link
                  key={r.id}
                  href={`/store/kuchaman-city/menu/${r.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  {r.image ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative bg-muted">
                      <Image src={r.image} alt={r.name} fill className="object-cover" sizes="48px" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
                      🎂
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.categoryName}</p>
                  </div>
                  <span className="text-sm font-bold text-foreground flex-shrink-0">{formatPrice(r.basePrice)}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Quick links when empty */}
          {!loading && query.length < 2 && (
            <div className="py-4 px-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {["Chocolate", "Red Velvet", "Butterscotch", "Birthday", "Anniversary", "KitKat"].map((term) => (
                  <button
                    key={term}
                    onClick={() => handleChange(term)}
                    className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
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
