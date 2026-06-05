"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
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
      {/* Sticky toolbar */}
      <div className="sticky top-[100px] md:top-[57px] z-40 bg-white/95 backdrop-blur-sm border-b border-border/50">
        {/* Search — hidden on mobile (header has search) */}
        <div className="hidden md:block max-w-[1300px] mx-auto px-4 md:px-5 pt-3 pb-2">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-[22px]">
                {visibleProducts.map((product) => {
                  const hasDiscount = product.mrpPrice && product.mrpPrice > product.basePrice;
                  const discountPct = hasDiscount ? Math.round(((product.mrpPrice! - product.basePrice) / product.mrpPrice!) * 100) : 0;
                  return (
                    <Link key={product.id} href={`/store/${storeSlug}/menu/${product.slug}`} prefetch={false}
                      className="product-card-premium group">
                      <div className="product-img-container relative">
                        {product.images[0] ? (
                          <HoverImageCycler images={product.images} alt={product.name} sizes="(max-width:640px) 50vw,25vw" />
                        ) : (
                          <div className="w-full h-full bg-surface-blush flex items-center justify-center">
                            <span className="text-muted-foreground text-xs">No Image</span>
                          </div>
                        )}
                        {product.isBestseller && <span className="badge-premium">Bestseller</span>}
                        {product.isNew && !product.isBestseller && <span className="badge-premium">New</span>}
                        {hasDiscount && <span className="badge-discount">{discountPct}% OFF</span>}
                      </div>
                      <div className="p-2.5 md:p-3.5">
                        <p className="text-muted-foreground text-[10px] md:text-[11px] font-bold uppercase tracking-[0.08em]">{product.categoryName}</p>
                        <h3 className="font-serif font-bold text-sm md:text-base leading-[1.15] tracking-[-0.03em] mt-1 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className="text-base md:text-lg font-black text-primary-hover">{formatPrice(product.basePrice)}</span>
                          <span className="mini-add-btn hidden md:inline-flex items-center text-xs">Add</span>
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

      {/* Cart Bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-20 md:bottom-4 z-50 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] md:w-auto md:min-w-[320px] md:max-w-md cart-bar-enter">
          <Link
            href="/cart"
            className="flex items-center justify-between bg-primary text-primary-foreground rounded-full px-4 py-2.5 md:px-5 md:py-3 hover:bg-primary-hover transition-all shadow-xl shadow-primary/30 btn-press"
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
