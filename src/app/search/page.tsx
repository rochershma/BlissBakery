import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/lib/db";
import { getCustomerStoreId } from "@/lib/customer-store";
import Link from "next/link";
import Image from "next/image";
import { AppHeader, AppFooter } from "@/components/v5/app-header";
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

  const store = await db.store.findFirst({ where: { id: await getCustomerStoreId() } });
  const storeSlug = store?.slug || "kuchaman-city";
  // Search only ever covers the store the customer is shopping in.
  const inStore = { category: { storeId: store?.id ?? "" } };

  let products: any[] = [];
  let totalCount = 0;

  if (query.length >= 2) {
    const priceMatch = query.match(/(?:under|below|upto|up to|less than|within)\s*₹?\s*(\d+)/i);
    const maxPrice = priceMatch ? parseInt(priceMatch[1], 10) : null;

    if (maxPrice) {
      const where = { isAvailable: true, ...inStore, basePrice: { lte: maxPrice } };
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
          { themes: { contains: word } }, { themeTags: { contains: word } },
          { flavours: { contains: word } }, { forWhom: { contains: word } },
        );
      }
      orConditions.push({ name: { contains: query } }, { shortDesc: { contains: query } });
      const where = { isAvailable: true, ...inStore, OR: orConditions };
      
      // Fetch more candidates for scoring
      const candidates = await db.product.findMany({
        where, include: { category: true, variants: { where: { isAvailable: true }, orderBy: { price: "asc" }, take: 1 } },
        take: 100,
        orderBy: [{ isBestseller: "desc" }, { name: "asc" }],
      });
      totalCount = await db.product.count({ where });
      
      // Score by relevance — name matches rank much higher
      const scored = candidates.map(p => {
        let score = 0;
        const nameLower = p.name.toLowerCase();
        const descLower = (p.shortDesc || "").toLowerCase();
        if (nameLower.includes(query.toLowerCase())) score += 100;
        for (const w of words) {
          if (nameLower.includes(w)) score += 30;
          if (p.category.name.toLowerCase().includes(w)) score += 15;
          if (descLower.includes(w)) score += 10;
        }
        if (words.length > 1 && words.every(w => nameLower.includes(w))) score += 50;
        if (p.isBestseller) score += 5;
        return { p, score };
      });
      scored.sort((a, b) => b.score - a.score);
      products = scored.slice(0, INITIAL_BATCH).map(s => s.p);
    }
  } else {
    [products, totalCount] = await Promise.all([
      db.product.findMany({
        where: { isAvailable: true, ...inStore }, include: { category: true, variants: { where: { isAvailable: true }, orderBy: { price: "asc" }, take: 1 } },
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

      <main className="flex-1 w-full wrap" style={{ paddingTop: 24, paddingBottom: 32 }}>
        <div className="sec-head sec-head--rule">
          <div>
            {query ? (
              <>
                <p className="t-micro">Results for</p>
                <h1 className="t-h1" style={{ marginTop: 6 }}>&ldquo;{query}&rdquo;</h1>
              </>
            ) : (
              <h1 className="t-h1">Every cake we bake</h1>
            )}
          </div>
          <form action="/search" method="GET" className="srch">
            <Search aria-hidden="true" />
            <input type="text" name="q" defaultValue={query} className="input" placeholder="Refine your search" />
          </form>
        </div>

        {products.length === 0 && query ? (
          <div className="v5empty">
            <h2 className="t-h2">Nothing matched &ldquo;{query}&rdquo;</h2>
            <p className="t-small">Try a shorter word — &ldquo;unicorn&rdquo; rather than &ldquo;unicorn theme cake&rdquo;.</p>
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

      <AppFooter />
    </div>
  );
}
