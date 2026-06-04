import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Phone, ChevronRight } from "lucide-react";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import { SiteHeader } from "@/components/shared/site-header";
import { AnnouncementBar } from "@/components/shared/announcement-bar";
import { HeroSlider } from "@/components/home/hero-slider";
import { CategoryCircles } from "@/components/home/category-circles";
import { HoverImageCycler } from "@/components/product/hover-image-cycler";
import { OccasionCarousel } from "@/components/home/occasion-carousel";

const occasions = [
  { name: "Birthday Cakes", image: "/images/categories/birthday.jpg", slug: "birthday" },
  { name: "Anniversary Cakes", image: "/images/categories/anniversary.jpg", slug: "anniversary" },
  { name: "Wedding Cakes", image: "/images/categories/wedding.jpg", slug: "wedding" },
  { name: "Designer Cakes", image: "/images/categories/designer.jpg", slug: "designer" },
  { name: "Festival Cakes", image: "/images/categories/festival.jpg", slug: "festival" },
  { name: "Retirement Cakes", image: "/images/categories/retirement.jpg", slug: "retirement" },
];

export default async function HomePage() {
  noStore(); // Make this page dynamic so banner/product changes show immediately
  const store = await db.store.findFirst({
    include: {
      categories: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } },
      banners: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!store) {
    return <div className="flex items-center justify-center min-h-screen"><p>Store not found.</p></div>;
  }

  const bestsellers = await db.product.findMany({
    where: { isBestseller: true, isAvailable: true },
    include: { category: true },
    take: 8,
  });

  // Fetch active promos for offers banner
  const activePromos = await db.promoCode.findMany({
    where: { isActive: true, validTo: { gt: new Date() }, validFrom: { lte: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Fetch occasions from DB
  const dbOccasions = await db.occasion.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const hours = parseJsonSafe<Record<string, { open: string; close: string }>>(store.operatingHours, {});
  const today = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
  const todayHours = hours[today];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Announcement Bar */}
      <AnnouncementBar />

      {/* Header */}
      <SiteHeader />

      {/* Hero Slider — from DB banners */}
      <HeroSlider banners={store.banners.map(b => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        ctaText: b.ctaText,
        ctaLink: b.ctaLink,
        mediaUrl: b.mediaUrl,
        linkUrl: b.linkUrl,
      }))} />

      {/* Category Circles — with real product images */}
      <CategoryCircles
        categories={(await Promise.all(store.categories.map(async (c) => {
          const count = await db.product.count({ where: { categoryId: c.id, isAvailable: true } });
          if (count === 0) return null;
          const firstProduct = await db.product.findFirst({
            where: { categoryId: c.id, isAvailable: true },
            orderBy: [{ isBestseller: "desc" }, { name: "asc" }],
            select: { images: true },
          });
          const imgs = parseJsonSafe<string[]>(firstProduct?.images, []);
          return { id: c.id, name: c.name, slug: c.slug, image: c.image, productImage: imgs[0] || null };
        }))).filter(Boolean) as { id: string; name: string; slug: string; image: string | null; productImage: string | null }[]}
        storeSlug={store.slug}
      />

      {/* Shop by Occasion — auto-sliding carousel */}
      <OccasionCarousel occasions={(dbOccasions.length > 0 ? dbOccasions : occasions).map(o => ({
        name: o.name,
        slug: o.slug,
        image: o.image || "/images/categories/cakes.jpg",
      }))} />

      {/* Bestsellers — Premium product cards */}
      {bestsellers.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-4 md:px-5 w-full">
          <div className="flex items-end justify-between gap-6 mt-16 md:mt-20 mb-6">
            <div>
              <p className="section-kicker">Our Signatures</p>
              <h2 className="text-[clamp(24px,3.5vw,38px)] font-serif font-bold leading-[0.98] tracking-[-0.055em]">Bestsellers made to impress.</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-[22px]">
            {bestsellers.map((product) => {
              const imgs = parseJsonSafe<string[]>(product.images, []);
              const img = imgs[0] || "/images/hero/AMMO6974.jpg";
              const hasDiscount = product.mrpPrice && product.mrpPrice > product.basePrice;
              const discountPct = hasDiscount ? Math.round(((product.mrpPrice! - product.basePrice) / product.mrpPrice!) * 100) : 0;
              return (
                <Link
                  key={product.id}
                  href={`/store/${store.slug}/menu/${product.slug}`}
                  prefetch={false}
                  className="product-card-premium group"
                >
                  <div className="product-img-container relative">
                    <HoverImageCycler images={imgs.length > 0 ? imgs : ['/images/hero/AMMO6974.jpg']} alt={product.name}>
                      {product.isBestseller && (
                        <span className="badge-premium">Bestseller</span>
                      )}
                    </HoverImageCycler>
                    {hasDiscount && (
                      <span className="badge-discount">{discountPct}% OFF</span>
                    )}
                  </div>
                  <div className="p-2.5 md:p-3.5">
                    <p className="text-muted-foreground text-[10px] md:text-[11px] font-bold uppercase tracking-[0.08em]">
                      {product.category.name}
                    </p>
                    <h3 className="font-serif font-bold text-sm md:text-base leading-[1.15] tracking-[-0.03em] mt-1 line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="text-base md:text-lg font-black text-primary-hover">{formatPrice(product.basePrice)}</span>
                      <span className="mini-add-btn hidden md:inline-flex items-center">Add</span>
                    </div>
                    {hasDiscount && (
                      <span className="text-[10px] text-muted-foreground line-through block">{formatPrice(product.mrpPrice!)}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <Link
              href={`/store/${store.slug}/menu`}
              className="btn-premium btn-premium-secondary text-sm inline-flex items-center gap-2"
            >
              View Full Menu <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Custom Cakes CTA — Premium two-column dark section */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-5 w-full mt-16 md:mt-20">
        <div className="custom-cta-premium">
          <div className="p-8 md:p-[54px] flex flex-col justify-center">
            <p className="text-[var(--gold)] text-xs font-black tracking-[0.15em] uppercase mb-2">Made Just For You</p>
            <h2 className="text-[clamp(28px,4vw,48px)] font-serif font-bold text-white leading-[0.98] tracking-[-0.055em]">
              Custom cakes for your exact celebration.
            </h2>
            <p className="text-white/[0.76] text-base md:text-lg leading-[1.7] mt-4 max-w-[510px]">
              Share a theme, reference image, flavor, message, and delivery date. Bliss Bakery turns your idea into a handcrafted eggless cake that feels personal and premium.
            </p>
            <div className="flex items-center gap-3.5 mt-5 flex-col md:flex-row">
              <Link href={`/store/${store.slug}/custom-cakes`} className="btn-premium btn-premium-primary text-sm w-full md:w-auto">
                Design Your Cake
              </Link>
              <a href={`https://wa.me/91${store.phone}`} className="btn-premium btn-premium-secondary text-sm w-full md:w-auto" target="_blank" rel="noopener noreferrer">
                Chat on WhatsApp
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-6">
              <div className="p-3.5 border border-white/[0.14] rounded-2xl bg-white/[0.08] text-sm font-bold text-white">1. Pick occasion</div>
              <div className="p-3.5 border border-white/[0.14] rounded-2xl bg-white/[0.08] text-sm font-bold text-white">2. Share reference</div>
              <div className="p-3.5 border border-white/[0.14] rounded-2xl bg-white/[0.08] text-sm font-bold text-white">3. Get fresh delivery</div>
            </div>
          </div>
          <div className="relative min-h-[290px] md:min-h-[430px] overflow-hidden md:rounded-r-[42px]">
            <Image
              src="/images/hero/customised-cakes-in-delhi.webp"
              alt="Custom Cakes"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Our Promise — Premium numbered cards */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-5 w-full">
        <div className="flex items-end justify-between gap-6 mt-16 md:mt-20 mb-6">
          <div>
            <p className="section-kicker">Why Choose Bliss</p>
            <h2 className="text-[clamp(24px,3.5vw,38px)] font-serif font-bold leading-[0.98] tracking-[-0.055em]">Premium, fresh, and reliable.</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-[18px]">
          <div className="promise-card">
            <div className="w-12 h-12 rounded-2xl bg-surface-blush text-primary-hover font-black text-lg grid place-items-center">01</div>
            <h3 className="font-serif font-bold text-2xl leading-[1.05] tracking-[-0.04em] mt-4">Same-day delivery</h3>
            <p className="text-muted-foreground text-sm leading-[1.55] mt-2.5">Order before 8 PM for fast delivery across Kuchaman City.</p>
          </div>
          <div className="promise-card">
            <div className="w-12 h-12 rounded-2xl bg-surface-blush text-primary-hover font-black text-lg grid place-items-center">02</div>
            <h3 className="font-serif font-bold text-2xl leading-[1.05] tracking-[-0.04em] mt-4">100% eggless</h3>
            <p className="text-muted-foreground text-sm leading-[1.55] mt-2.5">Every cake, pastry, brownie, and cookie is vegetarian and eggless.</p>
          </div>
          <div className="promise-card">
            <div className="w-12 h-12 rounded-2xl bg-surface-blush text-primary-hover font-black text-lg grid place-items-center">03</div>
            <h3 className="font-serif font-bold text-2xl leading-[1.05] tracking-[-0.04em] mt-4">Baked fresh daily</h3>
            <p className="text-muted-foreground text-sm leading-[1.55] mt-2.5">Small-batch baking with soft sponge, rich cream, and premium ingredients.</p>
          </div>
          <div className="promise-card">
            <div className="w-12 h-12 rounded-2xl bg-surface-blush text-primary-hover font-black text-lg grid place-items-center">04</div>
            <h3 className="font-serif font-bold text-2xl leading-[1.05] tracking-[-0.04em] mt-4">Custom designs</h3>
            <p className="text-muted-foreground text-sm leading-[1.55] mt-2.5">Theme cakes for birthdays, weddings, anniversaries, kids, and festivals.</p>
          </div>
        </div>
      </section>

      {/* Reviews — Premium trust block */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-5 w-full mt-16 md:mt-20">
        <div className="reviews-premium">
          <p className="section-kicker">Customer Proof</p>
          <h2 className="text-[clamp(28px,3.5vw,44px)] font-serif font-bold leading-[0.98] tracking-[-0.055em]">Loved for fresh taste and clean designs.</h2>
          <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1fr_1fr] gap-4 md:gap-[18px] mt-6">
            <div className="p-7 rounded-[22px] bg-chocolate text-white">
              <span className="text-[var(--gold)] font-black tracking-[0.1em] text-sm">★★★★★ RATING</span>
              <strong className="block text-[58px] font-serif leading-[1] mt-2">4.9</strong>
              <p className="text-white/60 text-sm mt-3 leading-[1.6]">Premium trust block for reviews, orders, and repeat customers.</p>
            </div>
            <div className="p-6 rounded-[22px] bg-surface-blush text-[#4c363c] leading-[1.65] font-semibold text-sm">
              &ldquo;The cake felt fresh, soft, and beautifully finished. The ordering experience was simple and delivery was on time.&rdquo;
            </div>
            <div className="p-6 rounded-[22px] bg-surface-blush text-[#4c363c] leading-[1.65] font-semibold text-sm">
              &ldquo;Perfect for birthday and anniversary orders. The premium product cards make choosing much easier.&rdquo;
            </div>
          </div>
        </div>
      </section>

      {/* Store Info */}
      <section className="py-6 mt-16 md:mt-20">
        <div className="max-w-[1200px] mx-auto px-4 md:px-5">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground border border-border rounded-2xl py-5 px-4 bg-white/60">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{store.city}, {store.state}</span>
            </div>
            {todayHours && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className={store.isOpen ? "text-success font-medium" : "text-destructive"}>
                  {store.isOpen ? "Open" : "Closed"}
                </span>
                <span>· {todayHours.open} – {todayHours.close}</span>
              </div>
            )}
            <a href={`tel:${store.phone}`} className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone className="w-4 h-4 text-primary" />
              <span>{store.phone}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer — Premium dark */}
      <footer className="bg-chocolate text-white/70 mt-0">
        <div className="max-w-[1200px] mx-auto px-4 md:px-5 py-12 md:py-[52px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_0.65fr_0.65fr] gap-9">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 relative bg-white p-2">
                  <Image src="/uploads/branding/logo.png" alt="Bliss Bakery" fill className="object-cover scale-125" sizes="48px" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-white text-[28px] leading-[1] tracking-[-0.04em]">Bliss Bakery</h3>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-[1.7] font-semibold max-w-md">
                Premium artisan bakery in Kuchaman City. Fresh eggless cakes, pastries, brownies, cookies, and custom celebration cakes.
              </p>
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-[28px] leading-[1] tracking-[-0.04em] mb-4">Quick links</h3>
              <div className="space-y-2.5 text-sm">
                <Link href="/about" className="block hover:text-white transition-colors font-semibold">About Us</Link>
                <Link href={`/store/${store.slug}/custom-cakes`} className="block hover:text-white transition-colors font-semibold">Custom Cakes</Link>
                <Link href="/offers" className="block hover:text-white transition-colors font-semibold">Offers</Link>
                <Link href="/contact" className="block hover:text-white transition-colors font-semibold">Contact</Link>
              </div>
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-[28px] leading-[1] tracking-[-0.04em] mb-4">Order today</h3>
              <p className="text-white/70 text-sm leading-[1.7] font-semibold">
                Same-day delivery before 8 PM.<br />
                Call: +91 {store.phone}<br />
                {store.city}, {store.state}
              </p>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-white/30">
            © {new Date().getFullYear()} Bliss Bakery. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
