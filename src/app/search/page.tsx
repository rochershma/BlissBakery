import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { ExploreRanges } from "@/components/shared/explore-ranges";
import { InfiniteProductGrid } from "@/components/shared/infinite-product-grid";
import { parseJsonSafe, getDisplayPrice } from "@/lib/utils";
import { Search } from "lucide-react";

const INITIAL_BATCH = 12;

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  noStore();
  const { q } = await searchParams;
  const query = q?.trim().replace(/[^\w\s\-&']/gi, "").substring(0, 50) || "";

  const store = await db.store.findFirst();
  const storeSlug = store?.slug || "kuchaman-city";

  let products: any[] = [];
  let totalCount = 0;

  if (query.length >= 2) {
    const priceMatch = query.match(/(?:under|below|upto|up to|less than|within)\s*₹?\s*(\d+)/i);
    const maxPrice = priceMatch ? parseInt(priceMatch[1], 10) : null;

    if (maxPrice) {
      const where = { isAvailable: true, basePrice: { lte: maxPrice } };
      [products, totalCount] = await Promise.all([
        db.product.findMany({
          where, include: { category: true, variants: { where: { isAvailable: true }, orderBy: { price: "asc" }, take: 1 } },
          orderBy: [{ basePrice: "asc" }, { isBestseller: "desc" }],
          take: INITIAL_BATCH,
        }),
        db.product.count({ where }),
      ]);
    } else {
      const words = query.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
      const orConditions: any[] = [];
      for (const word of words) {
        orConditions.push(
          { name: { contains: word } }, { shortDesc: { contains: word } },
          { category: { name: { contains: word } } }, { occasions: { contains: word } },
          { themes: { contains: word } }, { flavours: { contains: word } },
        );
      }
      orConditions.push({ name: { contains: query } }, { shortDesc: { contains: query } });
      const where = { isAvailable: true, OR: orConditions };
      [products, totalCount] = await Promise.all([
        db.product.findMany({
          where, include: { category: true, variants: { where: { isAvailable: true }, orderBy: { price: "asc" }, take: 1 } },
          orderBy: [{ isBestseller: "desc" }, { isFeatured: "desc" }, { name: "asc" }],
          take: INITIAL_BATCH,
        }),
        db.product.count({ where }),
      ]);
    }
  } else {
    [products, totalCount] = await Promise.all([
      db.product.findMany({
        where: { isAvailable: true }, include: { category: true, variants: { where: { isAvailable: true }, orderBy: { price: "asc" }, take: 1 } },
        orderBy: [{ isBestseller: "desc" }, { isFeatured: "desc" }, { name: "asc" }],
        take: INITIAL_BATCH,
      }),
      db.product.count({ where: { isAvailable: true } }),
    ]);
  }

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

        {/* Results */}
        {products.length === 0 && query ? (
          <div className="text-center py-16">
            <h2 className="text-lg font-bold text-foreground font-serif mb-2">No results found</h2>
            <p className="text-sm text-muted-foreground">Try a different search term</p>
          </div>
        ) : (
          <InfiniteProductGrid
            initialProducts={products.map((p: any) => {
              const imgs = parseJsonSafe<string[]>(p.images, []);
              const displayPrice = getDisplayPrice(p);
              return { id: p.id, name: p.name, slug: p.slug, displayPrice, mrpPrice: p.mrpPrice, image: imgs[0] || null, images: imgs, categoryName: p.category.name, isBestseller: p.isBestseller, isNew: p.isNew };
            })}
            totalCount={totalCount}
            storeSlug={storeSlug}
            apiParams={query ? `q=${encodeURIComponent(query)}` : ""}
          />
        )}
      </main>

      <ExploreRanges storeSlug={storeSlug} occasions={dbOccasions} themes={dbThemes} />

      <SiteFooter storeSlug={storeSlug} phone={store?.phone || undefined} city={store?.city || undefined} state={store?.state || undefined} />
    </div>
  );
}
