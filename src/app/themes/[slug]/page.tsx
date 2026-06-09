import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { ExploreRanges } from "@/components/shared/explore-ranges";
import { InfiniteProductGrid } from "@/components/shared/infinite-product-grid";
import { parseJsonSafe, getDisplayPrice } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";

const INITIAL_BATCH = 12;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tag?: string }>;
}

export default async function ThemePage({ params, searchParams }: Props) {
  noStore();
  const { slug } = await params;
  const { tag: activeTag } = await searchParams;

  const theme = await db.theme.findUnique({
    where: { slug },
    include: { tags: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!theme || !theme.isActive) return notFound();

  const store = await db.store.findFirst();
  if (!store) return notFound();

  // Validate tag against allowed values
  const validTag = activeTag && theme.tags.some(t => t.slug === activeTag) ? activeTag : undefined;

  // Build where clause
  const where: any = { isAvailable: true, themes: { contains: `"${slug}"` } };
  if (validTag) {
    where.themeTags = { contains: `"${validTag}"` };
  }

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

      {/* Sub-category circles — like occasion "for whom" */}
      {theme.tags.length > 0 && (
        <div className="max-w-[1300px] mx-auto w-full px-4 md:px-5 py-3">
          <div className="flex gap-5 md:gap-6 overflow-x-auto no-scrollbar pb-1">
            <Link href={`/themes/${slug}`} prefetch={false}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all relative ${!activeTag ? "border-primary shadow-md ring-2 ring-primary/20" : "border-border group-hover:border-primary/40"}`}>
                {theme.image ? (
                  <Image src={theme.image} alt="All" fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">All</div>
                )}
              </div>
              <span className={`text-[10px] md:text-[11px] font-semibold ${!activeTag ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>All</span>
            </Link>
            {theme.tags.map((tag) => (
              <Link key={tag.id} href={`/themes/${slug}?tag=${tag.slug}`} prefetch={false}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all relative ${activeTag === tag.slug ? "border-primary shadow-md ring-2 ring-primary/20" : "border-border group-hover:border-primary/40"}`}>
                  {tag.image ? (
                    <Image src={tag.image} alt={tag.name} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary text-center px-1">{tag.name}</div>
                  )}
                </div>
                <span className={`text-[10px] md:text-[11px] font-semibold text-center leading-tight max-w-[80px] ${activeTag === tag.slug ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>{tag.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-[1300px] mx-auto w-full px-4 md:px-5 pt-2 pb-4">
        <h1 className="text-[clamp(20px,3vw,30px)] font-serif font-bold text-foreground tracking-[-0.03em]">{theme.name}</h1>
        {theme.subtitle && <p className="text-sm text-muted-foreground mt-1">{theme.subtitle}</p>}
        <p className="text-xs text-muted-foreground mt-1">{totalCount === 0 ? "Coming soon" : `${totalCount} ${totalCount === 1 ? "product" : "products"} · 100% Eggless`}</p>
      </div>
      <main className="flex-1 max-w-[1300px] mx-auto w-full px-4 md:px-5 pb-24">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-lg font-bold text-foreground font-serif mb-2">No cakes found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {validTag ? "Try removing the filter to see more options" : "Products will appear here once tagged with this theme."}
            </p>
            <Link href={`/themes/${slug}`} className="text-primary text-sm font-medium hover:underline">View All {theme.name} →</Link>
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
            apiParams={`theme=${slug}${validTag ? `&tag=${validTag}` : ""}`}
          />
        )}
      </main>
      <ExploreRanges storeSlug={store.slug} occasions={dbOccasions} themes={dbThemes} />
      <SiteFooter storeSlug={store.slug} phone={store.phone || undefined} city={store.city || undefined} state={store.state || undefined} />
    </div>
  );
}
