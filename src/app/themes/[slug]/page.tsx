import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { ExploreRanges } from "@/components/shared/explore-ranges";
import { Pagination } from "@/components/shared/pagination";
import { formatPrice, parseJsonSafe, getDisplayPrice } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";
import { HoverImageCycler } from "@/components/product/hover-image-cycler";

const ITEMS_PER_PAGE = 20;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ThemePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10));

  const theme = await db.theme.findUnique({ where: { slug } });
  if (!theme || !theme.isActive) return notFound();

  const store = await db.store.findFirst();
  if (!store) return notFound();

  const where = { isAvailable: true, themes: { contains: `"${slug}"` } };
  const [products, totalCount, dbOccasions, allThemes] = await Promise.all([
    db.product.findMany({
      where, include: { category: true, variants: { where: { isAvailable: true }, orderBy: { price: "asc" }, take: 1 } },
      orderBy: [{ isBestseller: "desc" }, { isFeatured: "desc" }, { name: "asc" }],
      skip: (currentPage - 1) * ITEMS_PER_PAGE, take: ITEMS_PER_PAGE,
    }),
    db.product.count({ where }),
    db.occasion.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
    db.theme.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
  ]);
  const dbThemes = (await Promise.all(allThemes.map(async (t) => {
    const c = await db.product.count({ where: { isAvailable: true, themes: { contains: `"${t.slug}"` } } });
    return c > 0 ? t : null;
  }))).filter(Boolean) as typeof allThemes;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      {/* Breadcrumb */}
      <nav className="max-w-[1300px] mx-auto w-full px-4 md:px-5 py-2.5 text-xs text-muted-foreground flex items-center gap-1">
        <Link href="/" className="hover:text-primary flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{theme.name}</span>
      </nav>

      {/* Title */}
      <div className="max-w-[1300px] mx-auto w-full px-4 md:px-5 pt-2 pb-4">
        <h1 className="text-[clamp(20px,3vw,30px)] font-serif font-bold text-foreground tracking-[-0.03em]">{theme.name}</h1>
        {theme.subtitle && <p className="text-sm text-muted-foreground mt-1">{theme.subtitle}</p>}
        <p className="text-xs text-muted-foreground mt-1">{totalCount} products · 100% Eggless</p>
      </div>

      {/* Product Grid */}
      <main className="flex-1 max-w-[1300px] mx-auto w-full px-4 md:px-5 pb-24">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-lg font-bold text-foreground font-serif mb-2">No cakes found</h2>
            <p className="text-sm text-muted-foreground mb-4">Products will appear here once tagged with this theme.</p>
            <Link href="/" className="text-primary text-sm font-medium hover:underline">Back to Home →</Link>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-[22px]">
            {products.map((product) => {
              const imgs = parseJsonSafe<string[]>(product.images, []);
              const displayPrice = getDisplayPrice(product);
              const hasDiscount = product.mrpPrice && product.mrpPrice > displayPrice;
              const discountPct = hasDiscount ? Math.round(((product.mrpPrice! - displayPrice) / product.mrpPrice!) * 100) : 0;
              return (
                <Link key={product.id} href={`/store/${store.slug}/menu/${product.slug}`} prefetch={false}
                  className="product-card-premium group">
                  <div className="product-img-container relative">
                    <HoverImageCycler images={imgs.length > 0 ? imgs : ['/images/hero/AMMO6974.jpg']} alt={product.name}>
                      {product.isBestseller && <span className="badge-premium">Bestseller</span>}
                      {product.isNew && !product.isBestseller && <span className="badge-premium">New</span>}
                    </HoverImageCycler>
                    {hasDiscount && <span className="badge-discount">{discountPct}% OFF</span>}
                  </div>
                  <div className="p-2.5 md:p-3.5">
                    <p className="text-muted-foreground text-[10px] md:text-[11px] font-bold uppercase tracking-[0.08em]">{product.category.name}</p>
                    <h3 className="font-serif font-bold text-sm md:text-base leading-[1.15] tracking-[-0.03em] mt-1 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="text-base md:text-lg font-black text-primary-hover">{formatPrice(displayPrice)}</span>
                      <span className="mini-add-btn inline-flex items-center">Add</span>
                    </div>
                    {hasDiscount && <span className="text-[10px] text-muted-foreground line-through block">{formatPrice(product.mrpPrice!)}</span>}
                  </div>
                </Link>
              );
            })}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={`/themes/${slug}`} />
          </>
        )}
      </main>

      <ExploreRanges storeSlug={store.slug} occasions={dbOccasions} themes={dbThemes} />
      <SiteFooter storeSlug={store.slug} phone={store.phone || undefined} city={store.city || undefined} state={store.state || undefined} />
    </div>
  );
}

