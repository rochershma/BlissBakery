"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice, getDisplayPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { HoverImageCycler } from "@/components/product/hover-image-cycler";
import { AddOnsUpsellModal } from "@/components/product/addons-upsell-modal";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  shortDesc: string | null;
  basePrice: number;
  mrpPrice: number | null;
  images: string[];
  isBestseller: boolean;
  isNew: boolean;
  categorySlug: string;
  categoryName: string;
  flavours: string[];
  variants: { id: string; name: string; price: number }[];
}

interface Props {
  storeSlug: string;
  categories: CategoryItem[];
  products: ProductItem[];
  storeAddOns: { id: string; name: string; price: number; image: string | null; category: string }[];
  activeCategory: string | null;
  searchQuery: string;
}

const categoryEmojis: Record<string, string> = {};

export function MenuClient({ storeSlug, categories, products, storeAddOns, activeCategory, searchQuery }: Props) {
  const router = useRouter();
  const { addItem, items, getItemCount, getSubtotal, setStoreSlug } = useCartStore();
  const [search, setSearch] = useState(searchQuery);
  const [hydrated, setHydrated] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [upsellProduct, setUpsellProduct] = useState<{ name: string; image?: string; price: number; variant?: string } | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setHydrated(true), []);;

  const itemCount = hydrated ? getItemCount() : 0;
  const subtotal = hydrated ? getSubtotal() : 0;

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      if (activeCategory) params.set("category", activeCategory);
      router.replace(`/store/${storeSlug}/menu?${params.toString()}`);
    }, 350);
  };

  const handleAddToCart = (product: ProductItem) => {
    setStoreSlug(storeSlug);
    const price = product.variants.length > 0 ? product.variants[0].price : product.basePrice;
    const variantName = product.variants.length > 0 ? product.variants[0].name : undefined;
    const img = product.images[0] || undefined;
    addItem({ productId: product.id, productSlug: product.slug, name: product.name, image: img, variantName, unitPrice: price });
    // Show upsell modal
    setUpsellProduct({ name: product.name, image: img, price, variant: variantName });
  };

  const getItemQty = (productId: string) => {
    if (!hydrated) return 0;
    return items.filter((i) => i.productId === productId).reduce((sum, i) => sum + i.quantity, 0);
  };

  // Group products by category
  const grouped = categories
    .map((cat) => ({
      ...cat,
      products: products.filter((p) => p.categorySlug === cat.slug),
    }))
    .filter((g) => g.products.length > 0);

  return (
    <div className="flex-1 flex flex-col">
      {/* ===== MOBILE: Split layout with left rail ===== */}
      <div className="md:hidden flex flex-1 overflow-hidden" style={{ height: "calc(100dvh - 140px)" }}>
        {/* Left Rail — Category icons */}
        <aside className="w-[72px] flex-shrink-0 bg-pink-50/50 border-r border-pink-100/60 overflow-y-auto no-scrollbar py-2">
          <button
            onClick={() => router.replace(`/store/${storeSlug}/menu`)}
            className={`w-full py-2.5 px-1 flex flex-col items-center text-center gap-1 transition-all ${
              !activeCategory ? "bg-white shadow-sm border-r-2 border-primary" : ""
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
              !activeCategory ? "bg-primary text-white" : "bg-white border border-pink-100 text-muted-foreground"
            }`}>All</div>
            <span className="text-[9px] font-bold text-foreground leading-tight">All</span>
          </button>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => router.replace(`/store/${storeSlug}/menu?category=${cat.slug}`)}
                className={`w-full py-2.5 px-1 flex flex-col items-center text-center gap-1 transition-all ${
                  isActive ? "bg-white shadow-sm border-r-2 border-primary" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-colors ${
                  isActive ? "border-primary shadow-sm" : "border-transparent"
                }`}>
                  <div className="w-full h-full bg-pink-100 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{cat.name.slice(0, 2)}</span>
                  </div>
                </div>
                <span className={`text-[9px] font-bold leading-tight line-clamp-1 ${isActive ? "text-primary" : "text-foreground"}`}>{cat.name}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Panel — Product feed */}
        <section className="flex-1 overflow-y-auto no-scrollbar bg-white p-3 pb-20">
          {/* Current category title */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-pink-50">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
              {activeCategory ? categories.find(c => c.slug === activeCategory)?.name || "All" : "All Products"}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold">{products.length} items</span>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-primary/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No products found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Try selecting a different category</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {products.map((product) => {
                const displayPrice = getDisplayPrice(product);
                const hasDiscount = product.mrpPrice && product.mrpPrice > displayPrice;
                return (
                  <Link key={product.id} href={`/store/${storeSlug}/menu/${product.slug}`} prefetch={false}
                    className="flex items-center gap-3 bg-white rounded-2xl border border-pink-100/60 p-2.5 shadow-sm active:scale-[0.98] transition-transform">
                    {/* Product image */}
                    <div className="w-[72px] h-[72px] rounded-xl overflow-hidden bg-pink-50 flex-shrink-0">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">No img</div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{product.categoryName}</p>
                      <h3 className="font-serif font-bold text-[13px] leading-tight mt-0.5 line-clamp-1">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-sm font-black text-primary">{formatPrice(displayPrice)}</span>
                        {hasDiscount && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.mrpPrice!)}</span>}
                      </div>
                    </div>
                    {/* Add indicator */}
                    <div className="flex-shrink-0">
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">+</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ===== DESKTOP: Traditional layout ===== */}
      <div className="hidden md:block">
        {/* Sticky toolbar */}
        <div className="sticky top-[57px] z-40 bg-white/95 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-[1300px] mx-auto px-4 md:px-5 pt-3 pb-2">
            <div className="relative max-w-[400px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search cakes, pastries..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:bg-white transition-colors"
              />
              {search && (
                <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-border">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          {/* Category tabs */}
          <div className="max-w-[1300px] mx-auto px-4 md:px-5 pb-2.5 flex gap-2 overflow-x-auto no-scrollbar">
            <Link
              href={`/store/${storeSlug}/menu`}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                !activeCategory ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-foreground border-border hover:border-primary/40"
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${storeSlug}/menu?category=${cat.slug}`}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  activeCategory === cat.slug ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-foreground border-border hover:border-primary/40"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Products */}
        <main className="flex-1 max-w-[1300px] mx-auto px-4 md:px-5 py-6 w-full">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">No products found.</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.id} className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground font-serif">
                    {group.name}
                    <span className="text-xs font-normal text-muted-foreground font-sans ml-2">({group.products.length})</span>
                  </h2>
                </div>
                {(() => {
                  const INITIAL_SHOW = 8;
                  const isExpanded = expandedCats.has(group.slug) || !!activeCategory || !!search;
                  const visibleProducts = isExpanded ? group.products : group.products.slice(0, INITIAL_SHOW);
                  const hasMore = group.products.length > INITIAL_SHOW && !isExpanded;
                  return (
                    <>
                <div className="grid grid-cols-4 gap-[22px]">
                  {visibleProducts.map((product) => {
                    const displayPrice = getDisplayPrice(product);
                    const hasDiscount = product.mrpPrice && product.mrpPrice > displayPrice;
                    const discountPct = hasDiscount ? Math.round(((product.mrpPrice! - displayPrice) / product.mrpPrice!) * 100) : 0;
                    return (
                      <Link key={product.id} href={`/store/${storeSlug}/menu/${product.slug}`} prefetch={false}
                        className="product-card-premium group">
                        <div className="product-img-container relative">
                          {product.images[0] ? (
                            <HoverImageCycler images={[product.images[0]]} alt={product.name} sizes="25vw" />
                          ) : (
                            <div className="w-full h-full bg-surface-blush flex items-center justify-center">
                              <span className="text-muted-foreground text-xs">No Image</span>
                            </div>
                          )}
                          {product.isBestseller && <span className="badge-premium">Bestseller</span>}
                          {product.isNew && !product.isBestseller && <span className="badge-premium">New</span>}
                          {hasDiscount && <span className="badge-discount">{discountPct}% OFF</span>}
                        </div>
                        <div className="p-3.5">
                          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.08em]">{product.categoryName}</p>
                          <h3 className="font-serif font-bold text-base leading-[1.15] tracking-[-0.03em] mt-1 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                          <div className="flex items-center justify-between gap-2 mt-2">
                            <span className="text-lg font-black text-primary-hover">{formatPrice(displayPrice)}</span>
                            <span className="mini-add-btn inline-flex items-center text-xs">Add</span>
                          </div>
                          {hasDiscount && <span className="text-[10px] text-muted-foreground line-through block">{formatPrice(product.mrpPrice!)}</span>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {hasMore && (
                  <button
                    onClick={() => setExpandedCats(prev => { const n = new Set(prev); n.add(group.slug); return n; })}
                    className="mt-3 w-full py-2 text-xs font-semibold text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    Show All {group.products.length} {group.name} →
                  </button>
                )}
                    </>
                  );
                })()}
              </div>
            ))
          )}
        </main>
      </div>

      {/* Cart Bar — desktop only (mobile has bottom nav cart tab) */}
      {itemCount > 0 && (
        <div className="hidden md:block fixed bottom-4 z-50 left-1/2 -translate-x-1/2 w-auto min-w-[320px] max-w-md cart-bar-enter">
          <Link
            href="/cart"
            className="flex items-center justify-between bg-primary text-primary-foreground rounded-full px-5 py-3 hover:bg-primary-hover transition-all shadow-xl shadow-primary/30 btn-press"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold">{formatPrice(subtotal)}</span>
              <span className="text-primary-foreground/70 text-sm">| {itemCount} {itemCount === 1 ? "item" : "items"}</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-sm">
              View Cart <span>→</span>
            </div>
          </Link>
        </div>
      )}

      {/* Add-ons Upsell Modal */}
      {upsellProduct && (
        <AddOnsUpsellModal
          storeAddOns={storeAddOns}
          productName={upsellProduct.name}
          productImage={upsellProduct.image}
          unitPrice={upsellProduct.price}
          variantName={upsellProduct.variant}
          storeSlug={storeSlug}
          onClose={() => setUpsellProduct(null)}
        />
      )}
    </div>
  );
}
