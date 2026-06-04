import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/shared/site-header";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";
import { HoverImageCycler } from "@/components/product/hover-image-cycler";

const OCCASION_CONFIG: Record<string, {
  title: string;
  subtitle: string;
  heroImage: string;
  relations: { key: string; label: string; image: string }[];
}> = {
  birthday: {
    title: "Birthday Cakes",
    subtitle: "Make every birthday magical with the perfect cake",
    heroImage: "/images/categories/birthday.jpg",
    relations: [
      { key: "wife", label: "For Wife", image: "/images/categories/for-wife.jpg" },
      { key: "husband", label: "For Husband", image: "/images/categories/for-husband.jpg" },
      { key: "kids", label: "For Kids", image: "/images/categories/for-kids.jpg" },
      { key: "mom", label: "For Mom", image: "/images/categories/for-mom.jpg" },
      { key: "dad", label: "For Dad", image: "/images/categories/for-dad.jpg" },
      { key: "friend", label: "For Friend", image: "/images/categories/for-friend.jpg" },
    ],
  },
  anniversary: {
    title: "Anniversary Cakes",
    subtitle: "Celebrate years of love with a cake as special as your bond",
    heroImage: "/images/categories/anniversary.jpg",
    relations: [
      { key: "wife", label: "For Wife", image: "/images/categories/for-wife.jpg" },
      { key: "husband", label: "For Husband", image: "/images/categories/for-husband.jpg" },
      { key: "mom", label: "For Parents", image: "/images/categories/for-mom.jpg" },
    ],
  },
  wedding: {
    title: "Wedding Cakes",
    subtitle: "Grand cakes for your grand celebration",
    heroImage: "/images/categories/wedding.jpg",
    relations: [],
  },
  festival: {
    title: "Festival Cakes",
    subtitle: "Sweeten every festival with our special collection",
    heroImage: "/images/categories/festival.jpg",
    relations: [],
  },
  retirement: {
    title: "Retirement Cakes",
    subtitle: "Celebrate new beginnings with a memorable cake",
    heroImage: "/images/categories/retirement.jpg",
    relations: [],
  },
  designer: {
    title: "Designer Cakes",
    subtitle: "Unique and artistic cakes crafted for special moments",
    heroImage: "/images/categories/designer.jpg",
    relations: [
      { key: "kids", label: "For Kids", image: "/images/categories/for-kids.jpg" },
      { key: "wife", label: "For Her", image: "/images/categories/for-wife.jpg" },
      { key: "husband", label: "For Him", image: "/images/categories/for-husband.jpg" },
    ],
  },
};

interface Props {
  params: Promise<{ occasion: string }>;
  searchParams: Promise<{ for?: string }>;
}

export default async function OccasionPage({ params, searchParams }: Props) {
  const { occasion } = await params;
  const { for: forWhom } = await searchParams;

  // Handle "for-*" slugs as recipient pages (e.g., /cakes/for-wife)
  if (occasion.startsWith("for-")) {
    const recipientSlug = occasion.replace("for-", "");
    const RECIPIENT_TITLES: Record<string, { title: string; subtitle: string }> = {
      wife: { title: "Cakes For Wife", subtitle: "Surprise your queen with a cake she'll love" },
      husband: { title: "Cakes For Husband", subtitle: "Make his day special with the perfect cake" },
      kids: { title: "Cakes For Kids", subtitle: "Fun, colorful cakes for little celebrations" },
      mom: { title: "Cakes For Mom", subtitle: "Show her your love with a beautiful cake" },
      dad: { title: "Cakes For Dad", subtitle: "A cake as special as he is" },
      friend: { title: "Cakes For Friend", subtitle: "Celebrate friendship with sweetness" },
      her: { title: "Cakes For Her", subtitle: "Beautiful cakes for the special women in your life" },
      him: { title: "Cakes For Him", subtitle: "Bold and delicious cakes for him" },
    };
    const rt = RECIPIENT_TITLES[recipientSlug];
    if (!rt) return notFound();

    const store = await db.store.findFirst();
    if (!store) return notFound();
    const dbRecipient = await db.recipient.findFirst({ where: { slug: recipientSlug } });
    const heroImage = dbRecipient?.image || "/images/categories/cakes.jpg";

    const products = await db.product.findMany({
      where: { isAvailable: true, forWhom: { contains: recipientSlug } },
      include: { category: true },
      orderBy: [{ isBestseller: "desc" }, { isFeatured: "desc" }, { name: "asc" }],
    });

    return (
      <div className="flex flex-col min-h-screen bg-background">
        <SiteHeader />
        <nav className="max-w-[1300px] mx-auto w-full px-4 md:px-5 py-2.5 text-xs text-muted-foreground flex items-center gap-1">
          <Link href="/" className="hover:text-primary flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{rt.title}</span>
        </nav>
        <div className="max-w-[1300px] mx-auto w-full px-4 md:px-5 pt-2 pb-4">
          <h1 className="text-[clamp(20px,3vw,30px)] font-serif font-bold text-foreground tracking-[-0.03em]">{rt.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">{products.length} products · 100% Eggless</p>
        </div>
        <main className="flex-1 max-w-[1300px] mx-auto w-full px-4 md:px-5 pb-24">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-lg font-bold text-foreground font-serif mb-2">No cakes found</h2>
              <p className="text-sm text-muted-foreground">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-[22px]">
              {products.map((product) => {
                const imgs = parseJsonSafe<string[]>(product.images, []);
                const hasDiscount = product.mrpPrice && product.mrpPrice > product.basePrice;
                const discountPct = hasDiscount ? Math.round(((product.mrpPrice! - product.basePrice) / product.mrpPrice!) * 100) : 0;
                return (
                  <Link key={product.id} href={`/store/${store.slug}/menu/${product.slug}`} prefetch={false}
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
          )}
        </main>
      </div>
    );
  }

  // Regular occasion page logic
  // Try DB first, then fallback to hardcoded config
  const dbOccasion = await db.occasion.findUnique({
    where: { slug: occasion },
    include: { recipients: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });

  const config = dbOccasion ? {
    title: dbOccasion.name,
    subtitle: dbOccasion.subtitle || "",
    heroImage: dbOccasion.image || "/images/categories/cakes.jpg",
    relations: dbOccasion.recipients.map(r => ({ key: r.slug, label: r.name, image: r.image || "/images/categories/cakes.jpg" })),
  } : OCCASION_CONFIG[occasion];

  if (!config) return notFound();

  const store = await db.store.findFirst();
  if (!store) return notFound();

  // Validate forWhom against allowed values
  const validForWhom = forWhom && config.relations.some(r => r.key === forWhom) ? forWhom : undefined;

  // Build where clause for filtering
  const products = await db.product.findMany({
    where: {
      isAvailable: true,
      occasions: { contains: occasion },
      ...(validForWhom ? { forWhom: { contains: validForWhom } } : {}),
    },
    include: { category: true, variants: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: [{ isBestseller: "desc" }, { isFeatured: "desc" }, { name: "asc" }],
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      {/* Breadcrumb */}
      <nav className="max-w-[1300px] mx-auto w-full px-4 md:px-5 py-2.5 text-xs text-muted-foreground flex items-center gap-1">
        <Link href="/" className="hover:text-primary flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{config.title}</span>
      </nav>

      {/* Sub-tag circles — "All" + relations */}
      <div className="max-w-[1300px] mx-auto w-full px-4 md:px-5 py-3">
        <div className="flex gap-5 md:gap-6 overflow-x-auto no-scrollbar pb-1">
          <Link href={`/cakes/${occasion}`} prefetch={false}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all relative ${!forWhom ? "border-primary shadow-md ring-2 ring-primary/20" : "border-border group-hover:border-primary/40"}`}>
              <Image src={config.heroImage} alt="All" fill className="object-cover" sizes="80px" />
            </div>
            <span className={`text-[10px] md:text-[11px] font-semibold ${!forWhom ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>All</span>
          </Link>
          {config.relations.map((r) => (
            <Link key={r.key} href={`/cakes/${occasion}?for=${r.key}`} prefetch={false}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all relative ${forWhom === r.key ? "border-primary shadow-md ring-2 ring-primary/20" : "border-border group-hover:border-primary/40"}`}>
                <Image src={r.image} alt={r.label} fill className="object-cover" sizes="80px" />
              </div>
              <span className={`text-[10px] md:text-[11px] font-semibold text-center leading-tight ${forWhom === r.key ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>{r.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Title + count */}
      <div className="max-w-[1300px] mx-auto w-full px-4 md:px-5 pt-2 pb-4">
        <h1 className="text-[clamp(20px,3vw,30px)] font-serif font-bold text-foreground tracking-[-0.03em]">{config.title}</h1>
        <p className="text-xs text-muted-foreground mt-1">{products.length} products · 100% Eggless</p>
      </div>

      {/* Product Grid — same style as homepage bestsellers */}
      <main className="flex-1 max-w-[1300px] mx-auto w-full px-4 md:px-5 pb-24">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-lg font-bold text-foreground font-serif mb-2">No cakes found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {forWhom ? "Try removing the filter to see more options" : "Check back soon!"}
            </p>
            <Link href={`/cakes/${occasion}`} className="text-primary text-sm font-medium hover:underline">View All {config.title} →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-[22px]">
            {products.map((product) => {
              const imgs = parseJsonSafe<string[]>(product.images, []);
              const hasDiscount = product.mrpPrice && product.mrpPrice > product.basePrice;
              const discountPct = hasDiscount ? Math.round(((product.mrpPrice! - product.basePrice) / product.mrpPrice!) * 100) : 0;
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
                      <span className="text-base md:text-lg font-black text-primary-hover">{formatPrice(product.basePrice)}</span>
                      <span className="mini-add-btn hidden md:inline-flex items-center">Add</span>
                    </div>
                    {hasDiscount && <span className="text-[10px] text-muted-foreground line-through block">{formatPrice(product.mrpPrice!)}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
  );
}
