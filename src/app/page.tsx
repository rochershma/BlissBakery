import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Phone, ChevronRight, Leaf, Star } from "lucide-react";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import { SiteHeader } from "@/components/shared/site-header";
import { AnnouncementBar } from "@/components/shared/announcement-bar";
import { HeroSlider } from "@/components/home/hero-slider";
import { CategoryCircles } from "@/components/home/category-circles";

const occasions = [
  { name: "Birthday", emoji: "🎂", image: "/images/hero/premium-birthday-cake-in-delhi_ef2e52cd-d46e-46e7-a5ef-aa0bc2fdd19d.webp" },
  { name: "Anniversary", emoji: "💕", image: "/images/hero/valentine_anniversary_17df2fc8-d068-4486-8f01-3aa5b1bf8a33.jpg" },
  { name: "Wedding", emoji: "💍", image: "/images/hero/customised-cakes-in-delhi.webp" },
  { name: "Festival", emoji: "🪔", image: "/images/hero/christmas_rum_cake.jpg" },
];

export default async function HomePage() {
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

      {/* Category Circles — Swiggy style */}
      <CategoryCircles
        categories={store.categories.map(c => ({ id: c.id, name: c.name, slug: c.slug }))}
        storeSlug={store.slug}
      />

      {/* Trust Badges — slim */}
      <div className="bg-white/80 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-center gap-5 md:gap-10 text-[11px] md:text-xs text-muted-foreground overflow-x-auto no-scrollbar">
            <span className="flex items-center gap-1.5 flex-shrink-0"><Leaf className="w-3.5 h-3.5 text-success" />100% Vegetarian</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5 flex-shrink-0">🥚✗ Eggless</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5 flex-shrink-0"><Clock className="w-3.5 h-3.5 text-primary" />Same Day Pickup</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5 flex-shrink-0"><Star className="w-3.5 h-3.5 text-primary" />Premium Quality</span>
          </div>
        </div>
      </div>

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
                    <Image
                      src={img}
                      alt={product.name}
                      fill
                      className="object-cover product-img-zoom"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    {product.isBestseller && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-wide uppercase">
                        Bestseller
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.category.name}</p>
                    <h4 className="font-serif font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-0.5 leading-snug">
                      {product.name}
                    </h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-foreground">{formatPrice(product.basePrice)}</span>
                      <span className="add-btn text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">
                        ADD +
                      </span>
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

      {/* Shop by Occasion */}
      <section className="bg-muted/50 py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-primary text-xs tracking-[0.2em] uppercase mb-1">For Every Celebration</p>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground font-serif">Shop by Occasion</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
            {occasions.map((occ) => (
              <Link
                key={occ.name}
                href={`/store/${store.slug}/menu`}
                className="category-card group relative h-40 md:h-52 rounded-xl overflow-hidden"
              >
                <Image src={occ.image} alt={occ.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="text-lg mb-0.5">{occ.emoji}</p>
                  <h4 className="font-serif font-bold text-sm">{occ.name} Cakes</h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {store.categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10 md:py-14 w-full">
          <div className="text-center mb-8">
            <p className="text-primary text-xs tracking-[0.2em] uppercase mb-1">Browse</p>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground font-serif">Shop by Category</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 stagger-children">
            {store.categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${store.slug}/menu?category=${cat.slug}`}
                className="category-card group bg-white rounded-xl border border-border p-3 text-center"
              >
                <div className="category-icon w-12 h-12 mx-auto mb-2 rounded-full bg-primary-light flex items-center justify-center text-xl">
                  {cat.slug === "cakes" ? "🎂" : cat.slug === "pastries" ? "🧁" : cat.slug === "brownies" ? "🍫" : cat.slug === "cookies-biscuits" ? "🍪" : cat.slug === "breads" ? "🍞" : cat.slug === "combos" ? "🎁" : cat.slug === "beverages" ? "☕" : "🍰"}
                </div>
                <h4 className="font-medium text-[11px] text-foreground group-hover:text-primary transition-colors leading-tight">{cat.name}</h4>
              </Link>
            ))}
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
