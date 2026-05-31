"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Edit, EyeOff, ChevronDown, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDesc: string | null;
  basePrice: number;
  isBestseller: boolean;
  isNew: boolean;
  isAvailable: boolean;
  variantCount: number;
  image: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  isVisible: boolean;
  products: Product[];
}

export function AdminMenuClient({ categories }: { categories: Category[] }) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // Filter categories with products
  const withProducts = categories.filter(c => c.products.length > 0);

  // Search filter
  const searchLower = search.toLowerCase();
  const filtered = withProducts.map(c => ({
    ...c,
    products: search
      ? c.products.filter(p => p.name.toLowerCase().includes(searchLower) || (p.shortDesc || "").toLowerCase().includes(searchLower))
      : c.products,
  })).filter(c => c.products.length > 0);

  // Tab filter
  const displayed = activeTab === "all" ? filtered : filtered.filter(c => c.slug === activeTab);

  const totalShown = displayed.reduce((s, c) => s + c.products.length, 0);

  return (
    <>
      {/* Search bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search products by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4 pb-1">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "all" ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          All ({withProducts.reduce((s, c) => s + c.products.length, 0)})
        </button>
        {withProducts.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveTab(c.slug)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === c.slug ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {c.name} ({c.products.length})
          </button>
        ))}
      </div>

      {/* Results count */}
      {search && (
        <p className="text-xs text-muted-foreground mb-3">
          {totalShown} result{totalShown !== 1 ? "s" : ""} for &quot;{search}&quot;
        </p>
      )}

      {/* Category sections */}
      {displayed.map(category => {
        const isCollapsed = collapsed.has(category.id);
        return (
          <div key={category.id} className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => toggleCollapse(category.id)}
                className="flex items-center gap-2 group"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                <h2 className="text-sm font-bold text-foreground">{category.name}</h2>
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {category.products.length}
                </span>
                {!category.isVisible && (
                  <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <EyeOff className="w-2.5 h-2.5" /> Hidden
                  </span>
                )}
              </button>
              <Link
                href={`/admin/menu/categories/${category.id}`}
                className="text-[10px] text-primary hover:underline font-medium"
              >
                Edit Category
              </Link>
            </div>

            {!isCollapsed && (
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="divide-y divide-border">
                  {category.products.map(product => (
                    <Link
                      key={product.id}
                      href={`/admin/menu/products/${product.id}`}
                      className="px-3 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted relative overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <Image src={product.image} alt="" fill className="object-cover" sizes="40px" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-sm">🎂</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground truncate">{product.name}</span>
                          {product.isBestseller && <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded font-medium flex-shrink-0">Best</span>}
                          {product.isNew && <span className="text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-medium flex-shrink-0">New</span>}
                          {!product.isAvailable && <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-medium flex-shrink-0">Off</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-foreground">{formatPrice(product.basePrice)}</span>
                          {product.variantCount > 0 && (
                            <span className="text-[9px] text-muted-foreground">{product.variantCount} sizes</span>
                          )}
                        </div>
                      </div>
                      <Edit className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {displayed.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No products match your search.
        </div>
      )}
    </>
  );
}
