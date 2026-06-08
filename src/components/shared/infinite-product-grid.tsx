"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { HoverImageCycler } from "@/components/product/hover-image-cycler";
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
  const imgs = product.images.length > 0 ? product.images : ["/images/hero/AMMO6974.jpg"];
  const hasDiscount = product.mrpPrice && product.mrpPrice > product.displayPrice;
  const discountPct = hasDiscount ? Math.round(((product.mrpPrice! - product.displayPrice) / product.mrpPrice!) * 100) : 0;

  return (
    <Link href={`/store/${storeSlug}/menu/${product.slug}`} prefetch={false} className="product-card-premium group">
      <div className="product-img-container relative">
        <HoverImageCycler images={imgs} alt={product.name}>
          {product.isBestseller && <span className="badge-premium">Bestseller</span>}
          {product.isNew && !product.isBestseller && <span className="badge-premium">New</span>}
        </HoverImageCycler>
        {hasDiscount && <span className="badge-discount">{discountPct}% OFF</span>}
      </div>
      <div className="p-2.5 md:p-3.5">
        <p className="text-muted-foreground text-[10px] md:text-[11px] font-bold uppercase tracking-[0.08em]">{product.categoryName}</p>
        <h3 className="font-serif font-bold text-sm md:text-base leading-[1.15] tracking-[-0.03em] mt-1 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-base md:text-lg font-black text-primary-hover">{formatPrice(product.displayPrice)}</span>
          <span className="mini-add-btn inline-flex items-center">Add</span>
        </div>
        {hasDiscount && <span className="text-[10px] text-muted-foreground line-through block">{formatPrice(product.mrpPrice!)}</span>}
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="product-card-premium animate-pulse">
      <div className="product-img-container bg-muted rounded-t-2xl" />
      <div className="p-2.5 md:p-3.5 space-y-2">
        <div className="h-2.5 w-16 bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-5 w-1/3 bg-muted rounded" />
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
        setProducts(prev => [...prev, ...newItems]);
        if (products.length + newItems.length >= totalCount) {
          setHasMore(false);
        }
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-[22px]">
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
