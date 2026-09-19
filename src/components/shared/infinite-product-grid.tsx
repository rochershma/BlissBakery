"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ProductCard as V5Card } from "@/components/v5/product-card";
import { ChevronUp } from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  displayPrice: number;
  mrpPrice: number | null;
  image: string | null;
  images: string[];
  categoryName: string;
  isBestseller: boolean;
  isNew: boolean;
}

interface Props {
  initialProducts: ProductItem[];
  totalCount: number;
  storeSlug: string;
  /** Query params for API: ?occasion=birthday&for=wife etc. */
  apiParams: string;
  batchSize?: number;
}

function ProductCard({ product, storeSlug }: { product: ProductItem; storeSlug: string }) {
  return (
    <V5Card
      p={{
        name: product.name,
        href: `/store/${storeSlug}/menu/${product.slug}`,
        image: product.image ?? product.images[0] ?? null,
        price: product.displayPrice,
        isFrom: true,
        isBestseller: product.isBestseller,
        isNew: product.isNew,
        sub: product.categoryName,
      }}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="card" aria-hidden>
      <div className="card__media sk" />
      <div className="card__body">
        <div className="sk" style={{ height: 14, width: "75%", borderRadius: 6 }} />
        <div className="sk" style={{ height: 12, width: "40%", borderRadius: 6, marginTop: 8 }} />
      </div>
    </div>
  );
}

export function InfiniteProductGrid({ initialProducts, totalCount, storeSlug, apiParams, batchSize = 12 }: Props) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalCount);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);

  // Reset state when props change (e.g., sub-category navigation)
  useEffect(() => {
    setProducts(initialProducts);
    setHasMore(initialProducts.length < totalCount);
    fetchingRef.current = false;
    setLoading(false);
  }, [apiParams, totalCount, initialProducts]);

  // Fetch next batch
  const fetchMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const sep = apiParams ? "&" : "?";
      const url = `/api/products/list?${apiParams}${apiParams ? sep : ""}offset=${products.length}&limit=${batchSize}`;
      const resp = await fetch(url.replace("??", "?"));
      if (!resp.ok) throw new Error("Failed to fetch");
      const data = await resp.json();
      const newItems: ProductItem[] = data.items || [];

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        // API pages can overlap, so drop ids we already hold.
        setProducts(prev => {
          const seen = new Set(prev.map(p => p.id));
          const merged = [...prev, ...newItems.filter(p => !seen.has(p.id))];
          if (merged.length >= totalCount || merged.length === prev.length) setHasMore(false);
          return merged;
        });
      }
    } catch {
      // Silently fail — user can scroll up and try again
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [hasMore, products.length, apiParams, batchSize, totalCount]);

  // Intersection Observer — triggers 200px before sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fetchingRef.current) {
          fetchMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMore]);

  // Show scroll-to-top after scrolling 2 screens
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > window.innerHeight * 1.5);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="v5grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
        ))}
        {/* Skeleton loaders while fetching */}
        {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`skel-${i}`} />)}
      </div>

      {/* Sentinel for intersection observer */}
      {hasMore && <div ref={sentinelRef} className="h-1" />}

      {/* End of list — simple back to top */}
      {!hasMore && products.length > 0 && (
        <div className="flex justify-center mt-8 mb-4">
          <button onClick={scrollToTop} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
            Back to top
          </button>
        </div>
      )}

      {/* Floating scroll-to-top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 w-10 h-10 rounded-full bg-white border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-muted transition-all active:scale-95"
          aria-label="Back to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
