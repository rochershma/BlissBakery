import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/shared/site-header";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";
import { HoverImageCycler } from "@/components/product/hover-image-cycler";

// Wide banner images for occasion page heroes (separate from card images)
const HERO_BANNERS: Record<string, string> = {
  birthday: "/images/hero/bakingo-birthday.png",
  anniversary: "/images/hero/bakingo-anniversary.png",
  designer: "/images/hero/bakingo-designer.png",
  wedding: "/images/hero/bakingo-regular.png",
  festival: "/images/hero/bakingo-mango.png",
  retirement: "/images/hero/bakingo-gourmet.png",
  "kids-cake": "/images/hero/bakingo-birthday.png",
};

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
        <section className="bg-gradient-to-br from-primary/15 via-background to-secondary/10 py-10 md:py-14 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-primary text-xs tracking-[0.25em] uppercase mb-2 font-medium">Bliss Bakery</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-serif mb-3">{rt.title}</h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">{rt.subtitle}</p>
            <p className="text-xs text-muted-foreground mt-3">{products.length} cakes available</p>
          </div>
        </section>
        <nav className="max-w-7xl mx-auto w-full px-4 py-2 text-xs text-muted-foreground flex items-center gap-1">
          <Link href="/" className="hover:text-primary flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{rt.title}</span>
        </nav>
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 pb-24">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-lg font-bold text-foreground font-serif mb-2">No cakes found</h2>
              <p className="text-sm text-muted-foreground">Check back soon!</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{products.length} cakes found</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 stagger-children">
                {products.map((product) => {
                  const imgs = parseJsonSafe<string[]>(product.images, []);
                  const img = imgs[0] || "/images/hero/AMMO6974.jpg";
                  return (
                    <Link key={product.id} href={`/store/${store.slug}/menu/${product.slug}`}
                      className="product-card group bg-white rounded-xl overflow-hidden border border-border">
                      <div className="aspect-square relative overflow-hidden bg-muted">
                        <Image src={img} alt={product.name} fill className="object-cover product-img-zoom" sizes="(max-width: 640px) 50vw, 25vw" />
                        {product.isBestseller && (
                          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-semibold px-2 py-0.5 rounded-full">Bestseller</span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.category.name}</p>
                        <h4 className="font-serif font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-0.5 leading-snug">{product.name}</h4>
                        <span className="font-bold text-foreground mt-2 block">{formatPrice(product.basePrice)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
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
    heroImage: HERO_BANNERS[occasion] || dbOccasion.image || "/images/categories/cakes.jpg",
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

      {/* Hero Banner — clean gradient, no image needed */}
      <section className="bg-gradient-to-br from-primary/15 via-background to-secondary/10 py-10 md:py-14 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-primary text-xs tracking-[0.25em] uppercase mb-2 font-medium">Bliss Bakery</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-serif mb-3">{config.title}</h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">{config.subtitle}</p>
          <p className="text-xs text-muted-foreground mt-3">{products.length} cakes available · 100% Vegetarian & Eggless</p>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto w-full px-4 py-2 text-xs text-muted-foreground flex items-center gap-1">
        <Link href="/" className="hover:text-primary flex items-center gap-1"><Home className="w-3 h-3" /> Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{config.title}</span>
      </nav>

      {/* Relation Filters — image circles */}
      {config.relations.length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-4 py-4">
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Who is it for?</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
            <Link
              href={`/cakes/${occasion}`}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
            >
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                !forWhom ? "border-primary shadow-md" : "border-border group-hover:border-primary/50"
              } relative`}>
                <Image src={config.heroImage} alt="All" fill className="object-cover" sizes="64px" />
              </div>
              <span className={`text-[10px] font-medium ${!forWhom ? "text-primary" : "text-muted-foreground"}`}>All</span>
            </Link>
            {config.relations.map((r) => (
              <Link
                key={r.key}
                href={`/cakes/${occasion}?for=${r.key}`}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
              >
                <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                  forWhom === r.key ? "border-primary shadow-md" : "border-border group-hover:border-primary/50"
                } relative`}>
                  <Image src={r.image} alt={r.label} fill className="object-cover" sizes="64px" />
                </div>
                <span className={`text-[10px] font-medium ${forWhom === r.key ? "text-primary" : "text-muted-foreground"}`}>{r.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Product Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 pb-24">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden relative">
              <Image src={config.heroImage} alt={config.title} fill className="object-cover" sizes="80px" />
            </div>
            <h2 className="text-lg font-bold text-foreground font-serif mb-2">No cakes found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {forWhom ? "Try removing the filter to see more options" : "Check back soon for new additions!"}
            </p>
            <Link href={`/cakes/${occasion}`} className="text-primary text-sm font-medium hover:underline">View All {config.title} →</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{products.length} cakes found</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 stagger-children">
              {products.map((product) => {
                const imgs = parseJsonSafe<string[]>(product.images, []);
                const img = imgs[0] || "/images/hero/AMMO6974.jpg";
                return (
                  <Link
                    key={product.id}
                    href={`/store/${store.slug}/menu/${product.slug}`}
                    className="product-card group bg-white rounded-2xl overflow-hidden border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="aspect-square relative overflow-hidden bg-muted">
                      <HoverImageCycler images={imgs.length > 0 ? imgs : ['/images/hero/AMMO6974.jpg']} alt={product.name}>
                        {product.isBestseller && (
                          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-semibold px-2 py-0.5 rounded-full z-10">Bestseller</span>
                        )}
                        {product.isNew && (
                          <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-[9px] font-semibold px-2 py-0.5 rounded-full z-10">New</span>
                        )}
                        {(product as any).mrpPrice && (product as any).mrpPrice > product.basePrice && (
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full z-10">
                            {Math.round(((product as any).mrpPrice - product.basePrice) / (product as any).mrpPrice * 100)}% OFF
                          </span>
                        )}
                      </HoverImageCycler>
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.category.name}</p>
                      <h4 className="font-serif font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-0.5 leading-snug">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-foreground">{formatPrice(product.basePrice)}</span>
                        {(product as any).mrpPrice && (product as any).mrpPrice > product.basePrice && (
                          <span className="text-xs text-muted-foreground line-through">{formatPrice((product as any).mrpPrice)}</span>
                        )}
                      </div>
                      {(product as any).servingInfo && (
                        <p className="text-[10px] text-muted-foreground mt-1">🍽️ {(product as any).servingInfo}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
