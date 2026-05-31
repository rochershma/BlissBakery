"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { HoverImageCycler } from "@/components/product/hover-image-cycler";

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
  images: string[];
  isBestseller: boolean;
  isNew: boolean;
  categorySlug: string;
  categoryName: string;
  variants: { id: string; name: string; price: number }[];
}

interface Props {
  storeSlug: string;
  categories: CategoryItem[];
  products: ProductItem[];
  activeCategory: string | null;
  searchQuery: string;
}

const categoryEmojis: Record<string, string> = {
  cakes: "🎂", pastries: "🧁", brownies: "🍫", "cookies-biscuits": "🍪", breads: "🍞", combos: "🎁", beverages: "☕",
};

export function MenuClient({ storeSlug, categories, products, activeCategory, searchQuery }: Props) {
  const router = useRouter();
  const { addItem, items, getItemCount, getSubtotal, setStoreSlug } = useCartStore();
  const [search, setSearch] = useState(searchQuery);
  const [showMenu, setShowMenu] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setHydrated(true), []);

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
    addItem({
      productId: product.id,
      name: product.name,
      image: img,
      variantName,
      unitPrice: price,
    });
  };

  const getItemQty = (productId: string) => {
    if (!hydrated) return 0;
    return items.filter((i) => i.productId === productId).reduce((sum, i) => sum + i.quantity, 0);
  };

  // Group products by category for display
  const grouped = categories
    .map((cat) => ({
      ...cat,
      products: products.filter((p) => p.categorySlug === cat.slug),
    }))
    .filter((g) => g.products.length > 0);

  return (
    <div className="flex-1 flex flex-col">
      {/* Combined Search + Categories — compact single sticky bar */}
      <div className="sticky top-[57px] z-40 bg-white/95 backdrop-blur-sm border-b border-border">
        {/* Search — slim */}
        <div className="max-w-7xl mx-auto px-4 pt-2 pb-1.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-muted/60 border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-border">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        {/* Category chips — compact scroll */}
        <div className="max-w-7xl mx-auto px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          <Link
            href={`/store/${storeSlug}/menu`}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !activeCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/store/${storeSlug}/menu?category=${cat.slug}`}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                activeCategory === cat.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
              }`}
            >
              <span className="text-sm">{categoryEmojis[cat.slug] || "🍰"}</span>
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Products */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-4 w-full">
        {grouped.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm text-muted-foreground">No products found.</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.id} className="mb-6">
              <h2 className="text-base font-bold text-foreground mb-2 flex items-center gap-2 font-serif">
                <span>{categoryEmojis[group.slug] || "🍰"}</span>
                {group.name}
                <span className="text-xs font-normal text-muted-foreground font-sans">({group.products.length})</span>
              </h2>
              {(() => {
                const INITIAL_SHOW = 8;
                const isExpanded = expandedCats.has(group.slug) || !!activeCategory || !!search;
                const visibleProducts = isExpanded ? group.products : group.products.slice(0, INITIAL_SHOW);
                const hasMore = group.products.length > INITIAL_SHOW && !isExpanded;
                return (
                  <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 stagger-children">
                {visibleProducts.map((product) => {
                  const qty = getItemQty(product.id);
                  return (
                    <div
                      key={product.id}
                      className="product-card bg-white rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      {/* Product Image */}
                      <Link href={`/store/${storeSlug}/menu/${product.slug}`} className="block">
                        <div className="aspect-square bg-muted relative overflow-hidden rounded-t-xl">
                          {product.images[0] ? (
                            <HoverImageCycler images={product.images} alt={product.name} sizes="(max-width:640px) 50vw,25vw">
                            </HoverImageCycler>
                          ) : (
                            <div className="w-full h-full bg-primary-light flex items-center justify-center text-2xl">
                              <span className="product-img-zoom">{categoryEmojis[product.categorySlug] || "🍰"}</span>
                            </div>
                          )}
                          {product.isBestseller && (
                            <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                              ★ BEST
                            </span>
                          )}
                          {product.isNew && (
                            <span className="absolute top-1.5 left-1.5 bg-accent text-accent-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Product Info — compact */}
                      <div className="p-2">
                        <div className="flex items-start gap-1 mb-0.5">
                          <span className="inline-block w-2 h-2 mt-[3px] border border-green-600 flex-shrink-0 rounded-sm">
                            <span className="block w-0.5 h-0.5 bg-green-600 rounded-full m-auto mt-[2px]" />
                          </span>
                          <Link
                            href={`/store/${storeSlug}/menu/${product.slug}`}
                            className="font-semibold text-[11px] text-foreground hover:text-primary transition-colors line-clamp-2 leading-tight"
                          >
                            {product.name}
                          </Link>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-bold text-foreground text-sm">
                            {product.variants.length > 0 ? (
                              <>{formatPrice(product.variants[0].price)}</>
                            ) : (
                              formatPrice(product.basePrice)
                            )}
                          </span>
                          {qty > 0 ? (
                            <div className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                              <button
                                onClick={() => {
                                  const item = items.find((i) => i.productId === product.id);
                                  if (item) {
                                    const { updateQuantity } = useCartStore.getState();
                                    updateQuantity(product.id, item.quantity - 1, item.variantName);
                                  }
                                }}
                                className="text-[10px] font-bold w-4 h-4 flex items-center justify-center"
                              >
                                −
                              </button>
                              <span className="text-[10px] font-bold min-w-[12px] text-center">{qty}</span>
                              <button
                                onClick={() => handleAddToCart(product)}
                                className="text-[10px] font-bold w-4 h-4 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="add-btn text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
                            >
                              ADD +
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
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

      {/* Cart Bar — full-width on mobile, floating pill on desktop */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 z-50 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] md:w-auto md:min-w-[320px] md:max-w-md cart-bar-enter">
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
    </div>
  );
}
