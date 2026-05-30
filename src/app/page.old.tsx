import { db } from "@/lib/db";
import Link from "next/link";
import { MapPin, Clock, Phone, ShoppingBag, ChevronRight, Leaf } from "lucide-react";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import { SiteHeader } from "@/components/shared/site-header";

export default async function HomePage() {
  const store = await db.store.findFirst({
    include: {
      categories: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
      },
      banners: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Store not found. Please run the seed script.</p>
      </div>
    );
  }

  const bestsellers = await db.product.findMany({
    where: { isBestseller: true, isAvailable: true },
    include: { category: true },
    take: 8,
  });

  const hours = parseJsonSafe<Record<string, { open: string; close: string }>>(
    store.operatingHours,
    {}
  );
  const today = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
  const todayHours = hours[today];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Shared Header with Login/Profile/Cart */}
      <SiteHeader />

      {/* Secondary Nav - like Theobroma */}
      <nav className="bg-white border-b border-border hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-6 text-sm font-medium">
            <li>
              <Link href="/" className="py-3 border-b-2 border-primary text-primary inline-block">
                Home
              </Link>
            </li>
            <li>
              <Link href={`/store/${store.slug}/menu`} className="py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50 inline-block transition-colors">
                Order Now
              </Link>
            </li>
            <li>
              <Link href={`/store/${store.slug}/custom-cakes`} className="py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50 inline-block transition-colors">
                Custom Cakes
              </Link>
            </li>
            <li>
              <Link href="/offers" className="py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50 inline-block transition-colors">
                Offers
              </Link>
            </li>
            <li>
              <Link href="/about" className="py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50 inline-block transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50 inline-block transition-colors">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Store Selector Bar — like Theobroma's outlet selector */}
      <section className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Selected Store</p>
                  <p className="font-semibold text-foreground">{store.name} — {store.city}</p>
                </div>
              </div>
              {todayHours && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 text-primary" />
                  <span className={store.isOpen ? "text-success font-medium" : "text-destructive"}>
                    {store.isOpen ? "OPEN" : "CLOSED"}
                  </span>
                  <span>· {todayHours.open} – {todayHours.close}</span>
                </div>
              )}
            </div>
            <a href={`tel:${store.phone}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <Phone className="w-3 h-3" />
              <span className="hidden sm:inline">{store.phone}</span>
            </a>
          </div>
        </div>
      </section>
      <section className="relative bg-gradient-to-br from-primary/10 via-primary-light to-secondary">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-14">
          <div className="text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-2">
              Freshly Baked with <span className="text-primary">Love</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
              Premium eggless cakes, pastries &amp; treats — handcrafted daily in Kuchaman City
            </p>
            <Link
              href={`/store/${store.slug}/menu`}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold text-lg hover:bg-primary-hover transition-colors shadow-lg shadow-primary/25 btn-press"
            >
              <ShoppingBag className="w-5 h-5" />
              Order Now
            </Link>
          </div>
        </div>
      </section>

      {/* Order Type Toggle */}
      <section className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/store/${store.slug}/menu`}
              className="flex-1 max-w-xs flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-hover transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Pick Up
            </Link>
            <Link
              href={`/store/${store.slug}/menu`}
              className="flex-1 max-w-xs flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border-2 border-primary text-primary font-medium text-sm hover:bg-primary-light transition-colors"
            >
              🚗 Delivery
            </Link>
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8 w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">⭐ Bestsellers</h3>
            <Link href={`/store/${store.slug}/menu`} className="text-sm text-primary font-medium hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger-children">
            {bestsellers.map((product) => (
              <Link
                key={product.id}
                href={`/store/${store.slug}/menu/${product.slug}`}
                className="product-card group bg-white rounded-xl border border-border overflow-hidden"
              >
                <div className="h-24 sm:h-28 bg-primary-light relative overflow-hidden flex items-center justify-center text-2xl text-primary/40">
                  <span className="product-img-zoom">🎂</span>
                  <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    ★ BEST
                  </span>
                </div>
                <div className="p-2">
                  <h4 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {product.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="font-bold text-sm text-foreground">{formatPrice(product.basePrice)}</span>
                    <span className="add-btn text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold cursor-pointer">ADD +</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Custom Cakes Banner */}
      <section className="max-w-7xl mx-auto px-4 py-3 w-full animate-fade-in-up">
        <Link
          href={`/store/${store.slug}/custom-cakes`}
          className="block bg-gradient-to-r from-accent to-primary rounded-xl p-4 md:p-5 text-white hover:shadow-xl hover:shadow-primary/20 transition-all btn-press"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base md:text-lg font-bold mb-0.5">🎂 Design Your Dream Cake</h3>
              <p className="text-white/80 text-xs md:text-sm">
                Custom cakes for birthdays, weddings &amp; every celebration
              </p>
            </div>
            <ChevronRight className="w-8 h-8 text-white/60" />
          </div>
        </Link>
      </section>

      {/* Shop by Category */}
      {store.categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8 w-full">
          <h3 className="text-lg font-bold text-foreground mb-3">📂 Shop by Category</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 stagger-children">
            {store.categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/store/${store.slug}/menu?category=${cat.slug}`}
                className="category-card group bg-white rounded-xl border border-border p-3 text-center"
              >
                <div className="category-icon w-10 h-10 mx-auto mb-1.5 rounded-full bg-primary-light flex items-center justify-center text-lg">
                  {cat.slug === "cakes" ? "🎂" : cat.slug === "pastries" ? "🧁" : cat.slug === "brownies" ? "🍫" : cat.slug === "cookies-biscuits" ? "🍪" : cat.slug === "breads" ? "🍞" : cat.slug === "combos" ? "🎁" : cat.slug === "beverages" ? "☕" : "🍰"}
                </div>
                <h4 className="font-medium text-[11px] text-foreground group-hover:text-primary transition-colors leading-tight">{cat.name}</h4>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-auto bg-foreground text-white/80">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
                  <span className="text-primary-light font-bold text-xs">bb</span>
                </div>
                <span className="font-bold text-white">Bliss Bakery</span>
              </div>
              <p className="text-sm text-white/60">
                100% Vegetarian &amp; Eggless bakery crafting fresh treats daily in Kuchaman City.
              </p>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-3">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                <li><Link href="/offers" className="hover:text-primary transition-colors">Offers</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms &amp; Conditions</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-3">Contact</h5>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {store.address}, {store.city}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <a href={`tel:${store.phone}`} className="hover:text-primary transition-colors">{store.phone}</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-6 pt-4 text-center text-xs text-white/40">
            © {new Date().getFullYear()} Bliss Bakery. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
