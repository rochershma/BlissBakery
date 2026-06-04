import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Phone, ChevronRight, Leaf, Truck, Heart, Sparkles } from "lucide-react";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import { SiteHeader } from "@/components/shared/site-header";
import { AnnouncementBar } from "@/components/shared/announcement-bar";
import { HeroSlider } from "@/components/home/hero-slider";
import { HoverImageCycler } from "@/components/product/hover-image-cycler";

export default async function HomePage() {
  noStore();
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
    take: 10,
  });

  const dbOccasions = await db.occasion.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Get category images from first bestseller product
  const categoriesWithImages = await Promise.all(store.categories.map(async (c) => {
    const count = await db.product.count({ where: { categoryId: c.id, isAvailable: true } });
    if (count === 0) return null;
    const firstProduct = await db.product.findFirst({
      where: { categoryId: c.id, isAvailable: true },
      orderBy: [{ isBestseller: "desc" }, { name: "asc" }],
      select: { images: true },
    });
    const imgs = parseJsonSafe<string[]>(firstProduct?.images, []);
    return { id: c.id, name: c.name, slug: c.slug, image: c.image || imgs[0] || null, count };
  }));
  const categories = categoriesWithImages.filter(Boolean) as { id: string; name: string; slug: string; image: string | null; count: number }[];

  const hours = parseJsonSafe<Record<string, { open: string; close: string }>>(store.operatingHours, {});
  const today = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
  const todayHours = hours[today];

  const occasions = dbOccasions.length > 0 ? dbOccasions.map(o => ({
    name: o.name, slug: o.slug, image: o.image || "/images/categories/cakes.jpg",
  })) : [
    { name: "Birthday Cakes", slug: "birthday", image: "/images/categories/birthday.jpg" },
    { name: "Anniversary Cakes", slug: "anniversary", image: "/images/categories/anniversary.jpg" },
    { name: "Wedding Cakes", slug: "wedding", image: "/images/categories/wedding.jpg" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <SiteHeader />

      {/* ═══ HERO BANNER ═══ */}
      <HeroSlider banners={store.banners.map(b => ({
        id: b.id, title: b.title, mediaUrl: b.mediaUrl, linkUrl: b.linkUrl,
      }))} />

      {/* ═══ CATEGORY IMAGE CARDS ═══ */}
      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${store.slug}/menu?category=${cat.slug}`}
                className="flex-shrink-0 w-[115px] md:w-[150px] group"
              >
                <div className="relative h-[130px] md:h-[158px] rounded-2xl overflow-hidden bg-foreground/5">
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-400 group-hover:scale-[1.05]"
                      sizes="150px"
                      loading="lazy"
                      quality={70}
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-3xl">🍰</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 z-[1]">
                    <h4 className="font-serif font-bold text-[13px] md:text-[15px] text-white leading-tight">{cat.name}</h4>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SHOP BY OCCASION ═══ */}
      {occasions.length > 0 && (
        <section className="py-4 md:py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-primary text-[11px] font-bold tracking-[0.15em] uppercase mb-0.5">For Every Celebration</p>
                <h3 className="text-lg md:text-xl font-bold text-foreground font-serif">Shop by Occasion</h3>
              </div>
              <Link href={`/store/${store.slug}/menu`} className="text-primary text-xs font-semibold hover:underline flex items-center gap-0.5">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-1">
              {occasions.map((occ) => (
                <Link
                  key={occ.slug}
                  href={`/cakes/${occ.slug}`}
                  className="flex-shrink-0 w-[150px] md:w-[175px] group"
                >
                  <div className="relative h-[175px] md:h-[205px] rounded-2xl overflow-hidden">
                    <Image
                      src={occ.image}
                      alt={occ.name}
                      fill
                      className="object-cover transition-transform duration-400 group-hover:scale-[1.05]"
                      sizes="175px"
                      loading="lazy"
                      quality={70}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 z-[1]">
                      <h4 className="font-serif font-bold text-sm text-white leading-tight">{occ.name}</h4>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BESTSELLERS ═══ */}
      {bestsellers.length > 0 && (
        <section className="py-6 md:py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-primary text-[11px] font-bold tracking-[0.15em] uppercase mb-0.5">Our Signatures</p>
                <h3 className="text-lg md:text-xl font-bold text-foreground font-serif">Bestsellers</h3>
              </div>
              <Link href={`/store/${store.slug}/menu`} className="text-primary text-xs font-semibold hover:underline flex items-center gap-0.5">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {bestsellers.map((product) => {
                const imgs = parseJsonSafe<string[]>(product.images, []);
                return (
                  <Link
                    key={product.id}
                    href={`/store/${store.slug}/menu/${product.slug}`}
                    className="product-card bg-white rounded-xl overflow-hidden border border-border group"
                  >
                    <div className="aspect-square relative overflow-hidden bg-muted">
                      <HoverImageCycler images={imgs.length > 0 ? imgs : ['/images/hero/AMMO6974.jpg']} alt={product.name} sizes="(max-width:640px) 50vw, 220px">
                        {product.isBestseller && (
                          <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full z-10">
                            Bestseller
                          </span>
                        )}
                      </HoverImageCycler>
                      {product.mrpPrice && product.mrpPrice > product.basePrice && (
                        <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full z-10">
                          {Math.round(((product.mrpPrice - product.basePrice) / product.mrpPrice) * 100)}% OFF
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="inline-flex items-center gap-0.5 bg-green-50 text-green-700 text-[7px] font-semibold px-1.5 py-0.5 rounded-full border border-green-200">
                          <Leaf className="w-2 h-2" /> Eggless
                        </span>
                        <span className="text-[7px] text-muted-foreground font-medium">Today</span>
                      </div>
                      <h4 className="font-semibold text-[12px] text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                      <div className="flex items-baseline gap-1.5 mt-1.5">
                        <span className="font-bold text-sm text-foreground">{formatPrice(product.basePrice)}</span>
                        {product.mrpPrice && product.mrpPrice > product.basePrice && (
                          <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.mrpPrice)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CUSTOM CAKE CTA ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-2 w-full">
        <Link
          href={`/store/${store.slug}/custom-cakes`}
          className="block relative h-44 md:h-56 rounded-2xl overflow-hidden group"
        >
          <Image
            src="/images/hero/customised-cakes-in-delhi.webp"
            alt="Custom Cakes"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            quality={75}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
          <div className="absolute inset-0 flex items-center px-6 md:px-10">
            <div className="text-white max-w-md">
              <p className="text-primary text-[11px] font-bold tracking-[0.15em] uppercase mb-1">Made Just For You</p>
              <h3 className="text-xl md:text-2xl font-bold font-serif mb-1.5 leading-tight">Design Your Dream Cake</h3>
              <p className="text-white/70 text-xs md:text-sm mb-3">Share your idea, theme, or reference image. We'll bake it fresh and eggless.</p>
              <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-full">
                Start Custom Order <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* ═══ TRUST / PROMISE ═══ */}
      <section className="py-8 md:py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-border p-4 text-center">
              <Truck className="w-6 h-6 mx-auto mb-2 text-primary" />
              <h4 className="font-semibold text-xs text-foreground">Same Day Delivery</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Order before 8 PM</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-4 text-center">
              <Leaf className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <h4 className="font-semibold text-xs text-foreground">100% Eggless</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Every product, always</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-4 text-center">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-primary" />
              <h4 className="font-semibold text-xs text-foreground">Baked Fresh Daily</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Finest ingredients</p>
            </div>
            <div className="bg-white rounded-2xl border border-border p-4 text-center">
              <Heart className="w-6 h-6 mx-auto mb-2 text-primary" />
              <h4 className="font-semibold text-xs text-foreground">Crafted with Love</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Handmade in Kuchaman City</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STORE INFO ═══ */}
      <section className="bg-white border-y border-border py-5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{store.city}, {store.state}</span>
            </div>
            {todayHours && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className={store.isOpen ? "text-green-600 font-medium" : "text-destructive"}>
                  {store.isOpen ? "Open" : "Closed"}
                </span>
                <span>· {todayHours.open} – {todayHours.close}</span>
              </div>
            )}
            <a href={`tel:${store.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>{store.phone}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[var(--dark-bg)] text-white/70">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 relative">
                  <Image src="/uploads/branding/logo.png" alt="Bliss Bakery" fill className="object-cover scale-125" sizes="44px" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-white text-base">Bliss Bakery</h4>
                  <p className="text-[10px] text-primary">100% Veg & Eggless</p>
                </div>
              </div>
              <p className="text-xs text-white/40 max-w-sm leading-relaxed">
                Premium artisan bakery in Kuchaman City, Rajasthan. Every product is handcrafted
                with the finest ingredients — 100% vegetarian and eggless, made with love.
              </p>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-3 text-xs">Quick Links</h5>
              <ul className="space-y-2 text-xs">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="/offers" className="hover:text-primary transition-colors">Offers</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-3 text-xs">Contact</h5>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  {store.address}, {store.city}
                </li>
                <li>
                  <a href={`tel:${store.phone}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" /> +91 {store.phone}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-5 text-center text-[10px] text-white/25">
            © {new Date().getFullYear()} Bliss Bakery. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
