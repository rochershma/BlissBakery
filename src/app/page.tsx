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

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10 md:py-14 w-full">
          <div className="text-center mb-8">
            <p className="text-primary text-xs tracking-[0.2em] uppercase mb-1">Our Signatures</p>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground font-serif">Bestsellers</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 stagger-children">
            {bestsellers.map((product) => {
              const imgs = parseJsonSafe<string[]>(product.images, []);
              const img = imgs[0] || "/images/hero/AMMO6974.jpg";
              return (
                <Link
                  key={product.id}
                  href={`/store/${store.slug}/menu/${product.slug}`}
                  className="product-card group bg-white rounded-xl overflow-hidden border border-border"
                >
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    <HoverImageCycler images={imgs.length > 0 ? imgs : ['/images/hero/AMMO6974.jpg']} alt={product.name}>
                      {product.isBestseller && (
                        <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-wide uppercase z-10">
                          Bestseller
                        </span>
                      )}
                    </HoverImageCycler>
                    {/* % OFF badge */}
                    {product.mrpPrice && product.mrpPrice > product.basePrice && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
                        {Math.round(((product.mrpPrice - product.basePrice) / product.mrpPrice) * 100)}% OFF
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    {/* Eggless + Delivery badges */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="inline-flex items-center gap-0.5 bg-green-50 text-green-700 text-[8px] font-semibold px-1.5 py-0.5 rounded-full border border-green-200">
                        <svg className="w-2 h-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/></svg>
                        Eggless
                      </span>
                      <span className="text-[8px] text-muted-foreground">🚚 Today</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.category.name}</p>
                    <h4 className="font-serif font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-0.5 leading-snug">
                      {product.name}
                    </h4>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="font-bold text-foreground">{formatPrice(product.basePrice)}</span>
                      {product.mrpPrice && product.mrpPrice > product.basePrice && (
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(product.mrpPrice)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <Link
              href={`/store/${store.slug}/menu`}
              className="inline-flex items-center gap-2 text-primary font-medium text-sm hover:underline"
            >
              View Full Menu <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Custom Cakes CTA */}
      <section className="max-w-7xl mx-auto px-4 py-4 w-full">
        <Link
          href={`/store/${store.slug}/custom-cakes`}
          className="block relative h-40 md:h-52 rounded-2xl overflow-hidden group"
        >
          <Image
            src="/images/hero/customised-cakes-in-delhi.webp"
            alt="Custom Cakes"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
          <div className="absolute inset-0 flex items-center px-6 md:px-10">
            <div className="text-white">
              <p className="text-primary text-xs tracking-[0.2em] uppercase mb-1">Made Just For You</p>
              <h3 className="text-xl md:text-2xl font-bold font-serif mb-1">Design Your Dream Cake</h3>
              <p className="text-white/70 text-sm">Custom cakes for birthdays, weddings & every celebration</p>
            </div>
          </div>
        </Link>
      </section>

      {/* Our Promise */}
      <section className="bg-gradient-to-b from-primary/5 to-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
          <div className="text-center mb-6">
            <p className="text-primary text-xs tracking-[0.2em] uppercase mb-0.5">Why Choose Us</p>
            <h3 className="text-xl md:text-2xl font-bold text-foreground font-serif">Our Promise</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            <div className="bg-white rounded-2xl border border-border p-4 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">🕐</div>
              <h4 className="font-serif font-bold text-xs text-foreground mb-0.5">Same Day Delivery</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Order before 8 PM</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-4 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-2xl">🌿</div>
              <h4 className="font-serif font-bold text-xs text-foreground mb-0.5">100% Veg & Eggless</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Every product, always</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-4 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-orange-100 to-yellow-50 flex items-center justify-center text-2xl">🎂</div>
              <h4 className="font-serif font-bold text-xs text-foreground mb-0.5">Baked Fresh Daily</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Finest ingredients only</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-4 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-50 flex items-center justify-center text-2xl">💝</div>
              <h4 className="font-serif font-bold text-xs text-foreground mb-0.5">Crafted with Love</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Handmade in Kuchaman City</p>
            </div>
          </div>
        </div>
      </section>

      {/* Store Info */}
      <section className="bg-white border-y border-border py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
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

      {/* Footer */}
      <footer className="bg-dark-bg text-white/70">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 relative">
                  <Image src="/uploads/branding/logo.png" alt="Bliss Bakery" fill className="object-cover scale-125" sizes="48px" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-white text-lg">Bliss Bakery</h4>
                  <p className="text-xs text-primary">100% Veg &amp; Eggless</p>
                </div>
              </div>
              <p className="text-sm text-white/50 max-w-md leading-relaxed">
                Premium artisan bakery in Kuchaman City, Rajasthan. Every product is handcrafted
                with the finest ingredients — 100% vegetarian and eggless, made with love.
              </p>
            </div>
            <div>
              <h5 className="font-serif font-semibold text-white mb-4 text-sm">Quick Links</h5>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="/offers" className="hover:text-primary transition-colors">Offers</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-serif font-semibold text-white mb-4 text-sm">Contact</h5>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  {store.address}, {store.city}
                </li>
                <li>
                  <a href={`tel:${store.phone}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Phone className="w-4 h-4 text-primary flex-shrink-0" /> +91 {store.phone}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-white/30">
            © {new Date().getFullYear()} Bliss Bakery. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
