import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import { HoverImageCycler } from "@/components/product/hover-image-cycler";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 16;

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, page: pageStr } = await searchParams;
  const query = q?.trim().replace(/[^\w\s\-&']/gi, "").substring(0, 50) || "";
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10));

  const store = await db.store.findFirst();
  const storeSlug = store?.slug || "kuchaman-city";

  // Search products
  let products: any[] = [];
  let totalCount = 0;

  if (query.length >= 2) {
    const where = {
      isAvailable: true,
      OR: [
        { name: { contains: query } },
        { shortDesc: { contains: query } },
        { description: { contains: query } },
        { category: { name: { contains: query } } },
        { occasions: { contains: query } },
        { themes: { contains: query } },
      ],
    };
    [products, totalCount] = await Promise.all([
      db.product.findMany({
        where,
        include: { category: true },
        orderBy: [{ isBestseller: "desc" }, { name: "asc" }],
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      db.product.count({ where }),
    ]);
  }

  // If no results or no query, show bestsellers
  const showBestsellers = products.length === 0;
  const bestsellers = showBestsellers
    ? await db.product.findMany({
        where: { isAvailable: true, isBestseller: true },
        include: { category: true },
        take: 8,
      })
    : [];

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="flex-1 max-w-[1300px] mx-auto w-full px-4 md:px-5 py-6">
        {/* Search header */}
        <div className="mb-6">
          {query ? (
            <>
              <p className="text-xs text-muted-foreground">Search results for</p>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mt-1">&ldquo;{query}&rdquo;</h1>
              <p className="text-sm text-muted-foreground mt-1">{totalCount} product{totalCount !== 1 ? "s" : ""} found</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Search</h1>
              <p className="text-sm text-muted-foreground mt-1">Find cakes, pastries, and more</p>
            </>
          )}
        </div>

        {/* Search input */}
        <form action="/search" method="GET" className="mb-8">
          <div className="relative max-w-[500px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search cakes, pastries, brownies..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              autoFocus
            />
          </div>
        </form>

        {/* Results grid */}
        {products.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-[22px]">
              {products.map((product: any) => {
                const imgs = parseJsonSafe<string[]>(product.images, []);
                const hasDiscount = product.mrpPrice && product.mrpPrice > product.basePrice;
                const discountPct = hasDiscount ? Math.round(((product.mrpPrice! - product.basePrice) / product.mrpPrice!) * 100) : 0;
                return (
                  <Link key={product.id} href={`/store/${storeSlug}/menu/${product.slug}`} prefetch={false}
                    className="product-card-premium group">
                    <div className="product-img-container relative">
                      <HoverImageCycler images={imgs.length > 0 ? imgs : ['/images/hero/AMMO6974.jpg']} alt={product.name}>
                        {product.isBestseller && <span className="badge-premium">Bestseller</span>}
                      </HoverImageCycler>
                      {hasDiscount && <span className="badge-discount">{discountPct}% OFF</span>}
                    </div>
                    <div className="p-2.5 md:p-3.5">
                      <p className="text-muted-foreground text-[10px] md:text-[11px] font-bold uppercase tracking-[0.08em]">{product.category.name}</p>
                      <h3 className="font-serif font-bold text-sm md:text-base leading-[1.15] tracking-[-0.03em] mt-1 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <span className="text-base md:text-lg font-black text-primary-hover">{formatPrice(product.basePrice)}</span>
                        <span className="mini-add-btn hidden md:inline-flex items-center">Add</span>
                      </div>
                      {hasDiscount && <span className="text-[10px] text-muted-foreground line-through block">{formatPrice(product.mrpPrice!)}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {currentPage > 1 && (
                  <Link href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                    className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-muted-foreground px-1">...</span>}
                      <Link href={`/search?q=${encodeURIComponent(query)}&page=${p}`}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-colors ${
                          p === currentPage ? "bg-primary text-white" : "border border-border hover:bg-muted"
                        }`}>
                        {p}
                      </Link>
                    </span>
                  ))
                }
                {currentPage < totalPages && (
                  <Link href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                    className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {/* No results — show bestsellers */}
        {showBestsellers && (
          <div>
            {query && (
              <div className="text-center py-8 mb-6">
                <p className="text-lg font-serif font-bold text-foreground">No results for &ldquo;{query}&rdquo;</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search term or explore our bestsellers below</p>
              </div>
            )}
            {bestsellers.length > 0 && (
              <>
                <p className="section-kicker">{query ? "You might like" : "Popular"}</p>
                <h2 className="text-xl font-serif font-bold text-foreground mb-5">Our Bestsellers</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-[22px]">
                  {bestsellers.map((product: any) => {
                    const imgs = parseJsonSafe<string[]>(product.images, []);
                    return (
                      <Link key={product.id} href={`/store/${storeSlug}/menu/${product.slug}`} prefetch={false}
                        className="product-card-premium group">
                        <div className="product-img-container relative">
                          <HoverImageCycler images={imgs.length > 0 ? imgs : ['/images/hero/AMMO6974.jpg']} alt={product.name}>
                            {product.isBestseller && <span className="badge-premium">Bestseller</span>}
                          </HoverImageCycler>
                        </div>
                        <div className="p-2.5 md:p-3.5">
                          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.08em]">{product.category.name}</p>
                          <h3 className="font-serif font-bold text-sm leading-[1.15] mt-1 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                          <span className="text-base font-black text-primary-hover mt-2 block">{formatPrice(product.basePrice)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <SiteFooter storeSlug={storeSlug} phone={store?.phone || undefined} city={store?.city || undefined} state={store?.state || undefined} />
    </div>
  );
}
