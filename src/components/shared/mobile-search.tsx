"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  image: string | null;
  categoryName: string;
}

const POPULAR_SEARCHES = [
  "Chocolate", "Birthday Cake", "Anniversary", "Pastries",
  "Brownies", "KitKat", "Red Velvet", "Custom Cake",
  "Photo Cake", "Bento", "Under ₹500",
];

export function MobileSearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length > 0) {
      onClose();
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const navigateToProduct = (slug: string) => {
    onClose();
    router.push(`/store/kuchaman-city/menu/${slug}`);
  };

  const navigateToSearch = (q: string) => {
    onClose();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Search header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-white">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close search"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Search cakes, pastries, brownies..."
              className="w-full pl-10 pr-9 py-3 rounded-xl bg-muted/40 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-colors"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-border"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {query.length < 2 ? (
          /* Popular searches */
          <div className="px-4 py-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Popular searches
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((t) => (
                <button
                  key={t}
                  onClick={() => navigateToSearch(t)}
                  className="px-3.5 py-2 rounded-xl bg-white text-sm font-medium text-foreground border border-border/50 hover:border-primary/40 hover:text-primary transition-colors min-h-[40px]"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : loading ? (
          /* Loading */
          <div className="px-4 py-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-16 h-16 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          /* Results */
          <div className="divide-y divide-border/50">
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateToProduct(item.slug)}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/30 transition-colors text-left min-h-[64px]"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-blush flex-shrink-0 relative">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">🎂</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">{item.categoryName}</p>
                </div>
                <span className="text-sm font-bold text-primary-hover flex-shrink-0">
                  {formatPrice(item.basePrice)}
                </span>
              </button>
            ))}
            {/* View all results link */}
            <button
              onClick={() => navigateToSearch(query)}
              className="w-full px-4 py-3.5 text-sm font-semibold text-primary text-center hover:bg-primary/5 transition-colors"
            >
              View all results for &ldquo;{query}&rdquo;
            </button>
          </div>
        ) : (
          /* No results */
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">No products found for &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
