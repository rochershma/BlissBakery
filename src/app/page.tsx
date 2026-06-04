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
  if (!store) return <div className="flex items-center justify-center min-h-screen"><p>Store not found.</p></div>;

  const bestsellers = await db.product.findMany({
    where: { isBestseller: true, isAvailable: true },
    include: { category: true },
    take: 10,
  });

  const dbOccasions = await db.occasion.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

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
    name: o.name, slug: o.slug, subtitle: o.subtitle || null, image: o.image || "/images/categories/cakes.jpg",
  })) : [
    { name: "Birthday Cakes", slug: "birthday", subtitle: "Make it magical", image: "/images/categories/birthday.jpg" },
    { name: "Anniversary Cakes", slug: "anniversary", subtitle: "Celebrate love", image: "/images/categories/anniversary.jpg" },
    { name: "Wedding Cakes", slug: "wedding", subtitle: "Elegant tiers", image: "/images/categories/wedding.jpg" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <SiteHeader />

      {/* ═══ HERO ═══ */}
      <div className="max-w-7xl mx-auto px-4 pt-5 md:pt-7">
        <div className="rounded-[28px] md:rounded-[42px] overflow-hidden shadow-lg">
          <HeroSlider banners={store.banners.map(b => ({
            id: b.id, title: b.title, mediaUrl: b.mediaUrl, linkUrl: b.linkUrl,
          }))} />
        </div>
      </div>

      {/* ═══ CATEGORIES — image cards, horizontal scroll ═══ */}
      <section className="pt-5 pb-2 md:pt-7 md:pb-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${store.slug}/menu?category=${cat.slug}`}
                prefetch={false}
                className="category-card flex-shrink-0 w-[120px] md:w-[150px] block relative rounded-[18px] overflow-hidden"
              >
                <div className="relative h-[132px] md:h-[158px] bg-foreground/10">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} fill className="object-cover" sizes="150px" quality={70} />
                  ) : (
                    <div className="w-full h-full bg-primary/10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <span className="absolute bottom-2.5 left-3 right-3 z-[1] font-serif font-bold text-[13px] md:text-[15px] text-white leading-tight">
                    {cat.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OCCASION CARDS ═══ */}
      {occasions.length > 0 && (
        <section className="py-6 md:py-10">
          <div className="max-w-7xl mx-auto px-4">
            {/* Section heading — left title + right description */}
            <div className="flex items-end justify-between gap-4 mb-5 md:mb-6">
              <div>
                <p className="text-primary text-[11px] font-bold tracking-[0.13em] uppercase mb-1">For Every Celebration</p>
                <h2 className="text-lg md:text-[22px] font-bold text-foreground font-serif leading-tight">Shop by Occasion</h2>
              </div>
              <p className="hidden md:block text-xs text-muted-foreground max-w-xs text-right leading-relaxed">
                Cakes designed for your special moments — birthdays, anniversaries, weddings, and more.
              </p>
            </div>
            <div className="flex gap-3.5 md:gap-4 overflow-x-auto no-scrollbar">
              {occasions.map((occ) => (
                <Link
                  key={occ.slug}
                  href={`/cakes/${occ.slug}`}
                  prefetch={false}
                  className="occasion-card flex-shrink-0 w-[155px] md:w-[200px] block relative rounded-[18px] overflow-hidden"
                >
                  <div className="relative h-[185px] md:h-[240px]">
                    <Image src={occ.image} alt={occ.name} fill className="object-cover" sizes="200px" quality={70} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 z-[1]">
                      <h3 className="font-serif font-bold text-[15px] md:text-[17px] text-white leading-tight">{occ.name}</h3>
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
            <div className="flex items-end justify-between gap-4 mb-5 md:mb-6">
              <div>
                <p className="text-primary text-[11px] font-bold tracking-[0.13em] uppercase mb-1">Our Signatures</p>
                <h2 className="text-lg md:text-[22px] font-bold text-foreground font-serif leading-tight">Bestsellers</h2>
              </div>
              <Link href={`/store/${store.slug}/menu`} prefetch={false} className="text-primary text-xs font-semibold hover:underline flex items-center gap-0.5 flex-shrink-0">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {bestsellers.map((product) => {
                const imgs = parseJsonSafe<string[]>(product.images, []);
                return (
                  <div key={product.id} className="product-card bg-white rounded-[22px] overflow-hidden border border-border">
                    <Link href={`/store/${store.slug}/menu/${product.slug}`} prefetch={false} className="block">
                      <div className="aspect-[4/3] md:aspect-square relative overflow-hidden bg-muted">
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
                    </Link>
                    <div className="p-2.5">
                      {/* Tags row */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="inline-flex items-center gap-0.5 bg-green-50 text-green-700 text-[7px] font-bold px-1.5 py-0.5 rounded-full border border-green-200">
                          <Leaf className="w-2 h-2" /> Eggless
                        </span>
                        <span className="text-[7px] text-muted-foreground font-bold">Today</span>
                      </div>
                      {/* Name */}
                      <Link href={`/store/${store.slug}/menu/${product.slug}`} prefetch={false}>
                        <h4 className="font-semibold text-[12px] text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {product.name}
                        </h4>
                      </Link>
                      {/* Price + Add */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-sm text-foreground">{formatPrice(product.basePrice)}</span>
                          {product.mrpPrice && product.mrpPrice > product.basePrice && (
                            <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.mrpPrice)}</span>
                          )}
                        </div>
                        <Link
                          href={`/store/${store.slug}/menu/${product.slug}`}
                          prefetch={false}
                          className="add-btn text-[10px] bg-foreground text-white px-3 py-1.5 rounded-full font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          Add
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CUSTOM CAKE CTA ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-4 w-full">
        <Link
          href={`/store/${store.slug}/custom-cakes`}
          prefetch={false}
          className="block relative rounded-[28px] md:rounded-[42px] overflow-hidden group"
        >
          <div className="relative h-48 md:h-64">
            <Image
              src="/images/hero/customised-cakes-in-delhi.webp"
              alt="Custom Cakes"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              quality={75}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--dark-bg)]/80 via-[var(--dark-bg)]/50 to-transparent" />
            <div className="absolute inset-0 flex items-center px-7 md:px-12">
              <div className="text-white max-w-md">
                <p className="text-primary text-[11px] font-bold tracking-[0.13em] uppercase mb-2">Made Just For You</p>
                <h3 className="text-xl md:text-2xl font-bold font-serif leading-tight">Design Your Dream Cake</h3>
                <p className="text-white/65 text-xs md:text-sm mt-2 leading-relaxed max-w-sm">
                  Share your idea, theme, or reference image. We&apos;ll bake it fresh and eggless.
                </p>
                <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-full mt-4 group-hover:shadow-lg transition-shadow">
                  Start Custom Order <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* ═══ TRUST PROMISE ═══ */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { icon: Truck, title: "Same Day Delivery", desc: "Order before 8 PM", color: "text-primary" },
              { icon: Leaf, title: "100% Eggless", desc: "Every product, always", color: "text-green-600" },
              { icon: Sparkles, title: "Baked Fresh Daily", desc: "Finest ingredients", color: "text-primary" },
              { icon: Heart, title: "Crafted with Love", desc: "Handmade in Kuchaman City", color: "text-primary" },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-[22px] border border-border p-5 md:p-6">
                <div className="w-10 h-10 rounded-[14px] bg-primary/8 flex items-center justify-center mb-3">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h4 className="font-serif font-bold text-sm text-foreground leading-tight">{item.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STORE INFO ═══ */}
      <section className="bg-white border-y border-border py-5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> {store.city}, {store.state}</span>
            {todayHours && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className={store.isOpen ? "text-green-600 font-medium" : "text-destructive"}>{store.isOpen ? "Open" : "Closed"}</span>
                · {todayHours.open} – {todayHours.close}
              </span>
            )}
            <a href={`tel:${store.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone className="w-3.5 h-3.5 text-primary" /> {store.phone}
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[var(--dark-bg)] text-white/60">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 relative">
                  <Image src="/uploads/branding/logo.png" alt="Bliss Bakery" fill className="object-cover scale-125" sizes="40px" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-white text-base leading-tight">Bliss Bakery</h4>
                  <p className="text-[10px] text-primary font-medium">100% Veg & Eggless</p>
                </div>
              </div>
              <p className="text-xs text-white/35 max-w-sm leading-relaxed">
                Premium artisan bakery in Kuchaman City, Rajasthan. Handcrafted with the finest ingredients.
              </p>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-3 text-xs tracking-wide">Quick Links</h5>
              <ul className="space-y-2 text-xs">
                <li><Link href="/about" prefetch={false} className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/contact" prefetch={false} className="hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="/offers" prefetch={false} className="hover:text-primary transition-colors">Offers</Link></li>
                <li><Link href="/privacy" prefetch={false} className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" prefetch={false} className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-3 text-xs tracking-wide">Contact</h5>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" /> {store.address}, {store.city}</li>
                <li><a href={`tel:${store.phone}`} className="flex items-center gap-2 hover:text-primary transition-colors"><Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" /> +91 {store.phone}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/8 mt-8 pt-5 text-center text-[10px] text-white/20">
            © {new Date().getFullYear()} Bliss Bakery. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
