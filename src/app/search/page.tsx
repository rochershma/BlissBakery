import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import { HoverImageCycler } from "@/components/product/hover-image-cycler";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const ITEMS_PER_PAGE = 20;

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, page: pageStr } = await searchParams;
  const query = q?.trim().replace(/[^\w\s\-&']/gi, "").substring(0, 50) || "";
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10));

  const store = await db.store.findFirst();
  const storeSlug = store?.slug || "kuchaman-city";

  let products: any[] = [];
  let totalCount = 0;

  if (query.length >= 2) {
    // Detect price intent (e.g. "under 500", "below 700", "under ₹500")
    const priceMatch = query.match(/(?:under|below|upto|up to|less than|within)\s*₹?\s*(\d+)/i);
    const maxPrice = priceMatch ? parseInt(priceMatch[1], 10) : null;

    if (maxPrice) {
      // Price-based filter
      const where = { isAvailable: true, basePrice: { lte: maxPrice } };
      [products, totalCount] = await Promise.all([
        db.product.findMany({
          where, include: { category: true },
          orderBy: [{ basePrice: "asc" }, { isBestseller: "desc" }],
          skip: (currentPage - 1) * ITEMS_PER_PAGE, take: ITEMS_PER_PAGE,
        }),
        db.product.count({ where }),
      ]);
    } else {
    // Split into words for broad matching ("kids cake" matches "kids" OR "cake")
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
    const orConditions: any[] = [];
    for (const word of words) {
      orConditions.push(
        { name: { contains: word } },
        { shortDesc: { contains: word } },
        { description: { contains: word } },
        { category: { name: { contains: word } } },
        { occasions: { contains: word } },
        { themes: { contains: word } },
        { flavours: { contains: word } },
        { forWhom: { contains: word } },
      );
    }
    // Also full phrase
    orConditions.push({ name: { contains: query } }, { shortDesc: { contains: query } });

    const where = { isAvailable: true, OR: orConditions };
    [products, totalCount] = await Promise.all([
      db.product.findMany({
        where, include: { category: true },
        orderBy: [{ isBestseller: "desc" }, { isFeatured: "desc" }, { name: "asc" }],
        skip: (currentPage - 1) * ITEMS_PER_PAGE, take: ITEMS_PER_PAGE,
      }),
      db.product.count({ where }),
    ]);

    // Pad with popular products if results are thin (page 1 only)
    if (products.length < ITEMS_PER_PAGE / 2 && currentPage === 1) {
      const ids = new Set(products.map((p: any) => p.id));
      const extra = await db.product.findMany({
        where: { isAvailable: true, id: { notIn: Array.from(ids) } },
        include: { category: true },
        orderBy: [{ isBestseller: "desc" }, { name: "asc" }],
        take: ITEMS_PER_PAGE - products.length,
      });
      products = [...products, ...extra];
    }
    } // close text-search else
  } else {
    // No query — show all products
    [products, totalCount] = await Promise.all([
      db.product.findMany({
        where: { isAvailable: true }, include: { category: true },
        orderBy: [{ isBestseller: "desc" }, { isFeatured: "desc" }, { name: "asc" }],
        skip: (currentPage - 1) * ITEMS_PER_PAGE, take: ITEMS_PER_PAGE,
      }),
      db.product.count({ where: { isAvailable: true } }),
    ]);
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Explore ranges
  const [dbOccasions, dbThemes] = await Promise.all([
    db.occasion.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
    db.theme.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="flex-1 max-w-[1300px] mx-auto w-full px-4 md:px-5 py-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            {query ? (
              <>
                <p className="text-xs text-muted-foreground">Showing results for</p>
                <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground mt-1">&ldquo;{query}&rdquo;</h1>
                <p className="text-xs text-muted-foreground mt-1">{totalCount} products</p>
              </>
            ) : (
              <>
                <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground">All Products</h1>
                <p className="text-xs text-muted-foreground mt-1">Browse our full collection</p>
              </>
            )}
          </div>
          {/* Compact search */}
          <form action="/search" method="GET" className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" name="q" defaultValue={query}
                placeholder="Refine search..."
                className="w-[220px] pl-9 pr-3 py-2 rounded-xl border border-border bg-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-colors" />
            </div>
          </form>
        </div>

        {/* Mobile search */}
        <form action="/search" method="GET" className="md:hidden mb-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" name="q" defaultValue={query}
              placeholder="Search cakes, pastries..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/20" />
          </div>
        </form>

        {/* Results grid */}
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
                    <span className="mini-add-btn inline-flex items-center">Add</span>
                  </div>
                  {hasDiscount && <span className="text-[10px] text-muted-foreground line-through block">{formatPrice(product.mrpPrice!)}</span>}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-8">
            {currentPage > 1 && (
              <Link href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .map((p, idx, arr) => (
                <span key={p} className="inline-flex">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-muted-foreground px-1 self-center">...</span>}
                  <Link href={`/search?q=${encodeURIComponent(query)}&page=${p}`}
                    className={`w-9 h-9 rounded-xl inline-flex items-center justify-center text-sm font-medium transition-colors ${
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
      </main>

      {/* Explore Our Cake Ranges */}
      {(dbOccasions.length > 0 || dbThemes.length > 0) && (
        <section className="border-t border-border/50">
          <div className="max-w-[1300px] mx-auto w-full px-4 md:px-5 py-10">
            <p className="section-kicker">Explore More</p>
            <h3 className="text-xl font-bold text-foreground font-serif mb-5">Our Cake Ranges</h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              <Link href={`/store/${storeSlug}/menu`} prefetch={false} className="flex-shrink-0 w-[180px] md:w-[220px] group">
                <div className="relative h-[140px] md:h-[160px] rounded-2xl overflow-hidden bg-chocolate shadow-sm">
                  <Image src="/images/categories/cakes.jpg" alt="All" fill className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" sizes="220px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-2.5 left-3 right-3 text-white font-serif font-bold text-xs">View All Menu</span>
                </div>
              </Link>
              {dbOccasions.map((occ) => (
                <Link key={occ.id} href={`/cakes/${occ.slug}`} prefetch={false} className="flex-shrink-0 w-[180px] md:w-[220px] group">
                  <div className="relative h-[140px] md:h-[160px] rounded-2xl overflow-hidden bg-chocolate shadow-sm">
                    {occ.image && <Image src={occ.image} alt={occ.name} fill className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" sizes="220px" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2.5 left-3 right-3 text-white font-serif font-bold text-xs">{occ.name}</span>
                  </div>
                </Link>
              ))}
              {dbThemes.map((t) => (
                <Link key={t.id} href={`/themes/${t.slug}`} prefetch={false} className="flex-shrink-0 w-[180px] md:w-[220px] group">
                  <div className="relative h-[140px] md:h-[160px] rounded-2xl overflow-hidden bg-chocolate shadow-sm">
                    {t.image && <Image src={t.image} alt={t.name} fill className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" sizes="220px" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2.5 left-3 right-3 text-white font-serif font-bold text-xs">{t.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter storeSlug={storeSlug} phone={store?.phone || undefined} city={store?.city || undefined} state={store?.state || undefined} />
    </div>
  );
}
