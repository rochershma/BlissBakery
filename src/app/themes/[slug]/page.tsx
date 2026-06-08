import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { ExploreRanges } from "@/components/shared/explore-ranges";
import { InfiniteProductGrid } from "@/components/shared/infinite-product-grid";
import { parseJsonSafe, getDisplayPrice } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";

const INITIAL_BATCH = 12;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ThemePage({ params }: Props) {
  const { slug } = await params;

  const theme = await db.theme.findUnique({ where: { slug } });
  if (!theme || !theme.isActive) return notFound();

  const store = await db.store.findFirst();
  if (!store) return notFound();

  const where = { isAvailable: true, themes: { contains: `"${slug}"` } };
  const [products, totalCount, dbOccasions, allThemes] = await Promise.all([
    db.product.findMany({
      where, include: { category: true, variants: { where: { isAvailable: true }, orderBy: { price: "asc" }, take: 1 } },
      orderBy: [{ isBestseller: "desc" }, { isFeatured: "desc" }, { name: "asc" }],
      take: INITIAL_BATCH,
    }),
    db.product.count({ where }),
    db.occasion.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
    db.theme.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
  ]);
  const dbThemes = (await Promise.all(allThemes.map(async (t) => {
    const c = await db.product.count({ where: { isAvailable: true, themes: { contains: `"${t.slug}"` } } });
    return c > 0 ? t : null;
  }))).filter(Boolean) as typeof allThemes;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />
      <nav className="max-w-[1300px] mx-auto w-full px-4 md:px-5 py-2.5 text-xs text-muted-foreground flex items-center gap-1">
        <Link href="/" className="hover:text-primary flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{theme.name}</span>
      </nav>
      <div className="max-w-[1300px] mx-auto w-full px-4 md:px-5 pt-2 pb-4">
        <h1 className="text-[clamp(20px,3vw,30px)] font-serif font-bold text-foreground tracking-[-0.03em]">{theme.name}</h1>
        {theme.subtitle && <p className="text-sm text-muted-foreground mt-1">{theme.subtitle}</p>}
        <p className="text-xs text-muted-foreground mt-1">{totalCount === 0 ? "Coming soon" : `${totalCount} products · 100% Eggless`}</p>
      </div>
      <main className="flex-1 max-w-[1300px] mx-auto w-full px-4 md:px-5 pb-24">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-lg font-bold text-foreground font-serif mb-2">No cakes found</h2>
            <p className="text-sm text-muted-foreground mb-4">Products will appear here once tagged with this theme.</p>
            <Link href="/" className="text-primary text-sm font-medium hover:underline">Back to Home →</Link>
          </div>
        ) : (
          <InfiniteProductGrid
            initialProducts={products.map(p => {
              const imgs = parseJsonSafe<string[]>(p.images, []);
              const displayPrice = getDisplayPrice(p);
              return { id: p.id, name: p.name, slug: p.slug, displayPrice, mrpPrice: p.mrpPrice, image: imgs[0] || null, images: imgs, categoryName: p.category.name, isBestseller: p.isBestseller, isNew: p.isNew };
            })}
            totalCount={totalCount}
            storeSlug={store.slug}
            apiParams={`theme=${slug}`}
          />
        )}
      </main>
      <ExploreRanges storeSlug={store.slug} occasions={dbOccasions} themes={dbThemes} />
      <SiteFooter storeSlug={store.slug} phone={store.phone || undefined} city={store.city || undefined} state={store.state || undefined} />
    </div>
  );
}
