import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/lib/db";
import { getCustomerStoreId } from "@/lib/customer-store";
import Link from "next/link";
import Image from "next/image";
import { AppHeader, AppFooter } from "@/components/v5/app-header";
import { ExploreRanges } from "@/components/shared/explore-ranges";
import { InfiniteProductGrid } from "@/components/shared/infinite-product-grid";
import { parseJsonSafe } from "@/lib/utils";
import { cardPrice } from "@/lib/pricing";
import { cleanQuery, productsByIds, searchProductIds } from "@/lib/search";
import { Search } from "lucide-react";

const INITIAL_BATCH = 12;

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  noStore();
  const { q } = await searchParams;
  const query = cleanQuery(q);

  const store = await db.store.findFirst({ where: { id: await getCustomerStoreId() } });
  const storeSlug = store?.slug || "kuchaman-city";
  // Search only ever covers the store the customer is shopping in.
  const inStore = { category: { storeId: store?.id ?? "" } };
  const include = { category: true, variants: { where: { isAvailable: true }, orderBy: { price: "asc" as const } } };

  let products: any[] = [];
  let totalCount = 0;

  if (query.length >= 2 && store) {
    const ids = await searchProductIds(store.id, query);
    totalCount = ids.length;
    products = await productsByIds(ids.slice(0, INITIAL_BATCH), (page) =>
      db.product.findMany({ where: { id: { in: page } }, include }));
  } else {
    [products, totalCount] = await Promise.all([
      db.product.findMany({
        where: { isAvailable: true, ...inStore }, include,
        orderBy: [{ isBestseller: "desc" }, { isFeatured: "desc" }, { name: "asc" }],
        take: INITIAL_BATCH,
      }),
      db.product.count({ where: { isAvailable: true, ...inStore } }),
    ]);
  }

  // Explore ranges
  const [dbOccasions, dbThemes] = await Promise.all([
    db.occasion.findMany({ where: { isActive: true, storeId: store?.id }, orderBy: { sortOrder: "asc" }, take: 8 }),
    db.theme.findMany({ where: { isActive: true, storeId: store?.id }, orderBy: { sortOrder: "asc" }, take: 8 }),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />

      <main className="flex-1 max-w-[1300px] mx-auto w-full px-4 md:px-5 py-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            {query ? (
              <>
                <p className="text-xs text-muted-foreground">{totalCount} {totalCount === 1 ? "result" : "results"} for</p>
                <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground mt-1">&ldquo;{query}&rdquo;</h1>
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
              const displayPrice = cardPrice(p);
              return { id: p.id, name: p.name, slug: p.slug, displayPrice, mrpPrice: p.mrpPrice, image: imgs[0] || null, images: imgs, categoryName: p.category.name, isBestseller: p.isBestseller, isNew: p.isNew };
            })}
            totalCount={totalCount}
            storeSlug={storeSlug}
            apiParams={`store=${encodeURIComponent(storeSlug)}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
          />
        )}
      </main>

      <ExploreRanges storeSlug={storeSlug} occasions={dbOccasions} themes={dbThemes} />

      <AppFooter />
    </div>
  );
}
