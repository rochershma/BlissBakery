import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { db as prisma } from "@/lib/db";
import { getCustomerStoreId } from "@/lib/customer-store";
import { fromPrice, type FlavourPrice } from "@/lib/pricing";
import { firstImage, img } from "@/lib/img";
import { parseJsonSafe, formatStoreAddress } from "@/lib/utils";
import { SiteHeaderV5 } from "@/components/v5/site-header";
import { SiteFooter } from "@/components/v5/site-footer";
import { HeroSlider, type Slide } from "@/components/v5/hero-slider";
import { ProductCard } from "@/components/v5/product-card";
import { IconLeaf, IconTruck, IconClock } from "@/components/v5/icons";
import { navLinks } from "@/lib/nav";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  noStore();

  const store = await prisma.store.findFirst({
    where: { id: await getCustomerStoreId() },
    include: {
      // An empty category is a dead end for the customer, so it stays off the
      // storefront until it is stocked.
      categories: {
        where: { isVisible: true, products: { some: { isAvailable: true } } },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: true } } },
      },
      banners: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!store) return null;

  const [occasions, themes, bestsellers] = await Promise.all([
    prisma.occasion.findMany({ where: { isActive: true, storeId: store.id }, orderBy: { sortOrder: "asc" } }),
    prisma.theme.findMany({
      where: { isActive: true, storeId: store.id },
      orderBy: { sortOrder: "asc" },
      include: { tags: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    }),
    prisma.product.findMany({
      where: { isBestseller: true, isAvailable: true, category: { storeId: store.id } },
      include: { variants: true },
      take: 12,
    }),
  ]);

  const slides: Slide[] = store.banners.map((b) => ({
    id: b.id,
    image: b.mediaUrl,
    mobileImage: b.mobileMediaUrl,
    title: b.title,
    subtitle: b.subtitle,
    ctaText: b.ctaText,
    href: b.ctaLink || b.linkUrl || null,
  }));

  // theme tags are the richest browse axis — prefer tags that have artwork
  const tagTiles = themes
    .flatMap((t) => t.tags.filter((g) => g.image).map((g) => ({
      name: g.name,
      href: `/themes/${t.slug}?tag=${g.slug}`,
      image: g.image,
    })))
    .slice(0, 14);
  const themeTiles = tagTiles.length
    ? tagTiles
    : themes.map((t) => ({ name: t.name, href: `/themes/${t.slug}`, image: t.image }));

  const nav = await navLinks(store.slug);
  const menuHref = `/store/${store.slug}/menu`;
  const heroImage = bestsellers.map((b) => firstImage(b.images)).find(Boolean) ?? null;

  return (
    <>
      <SiteHeaderV5 storeSlug={store.slug} storeName={store.name} storeCity={store.city} logo={store.logo} nav={nav} pincode={store.pincode} />

      <h1 className="sr-only">
        Bliss Bakery — 100% vegetarian and eggless cakes in {store.city}
      </h1>

      {slides.length > 0 && (
        <section className="sec" style={{ paddingTop: 16, paddingBottom: 0 }}>
          <div className="wrap">
            <HeroSlider slides={slides} />
            <div className="herobar">
              <div className="herobar__cta">
                <Link className="btn btn--rose btn--lg" href={menuHref}>Order now</Link>
                <Link className="btn btn--out btn--lg" href={`/store/${store.slug}/custom-cakes`}>
                  Design a custom cake
                </Link>
              </div>
              <div className="herobar__usp">
                <div><IconLeaf /><span>100% eggless</span></div>
                <div><IconTruck /><span>Same-day delivery</span></div>
                <div><IconClock /><span>Baked this morning</span></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* An occasion is the first thing a customer actually knows, so it leads —
          set as a printed index rather than another image rail. */}
      {occasions.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="sec-head sec-head--rule">
              <h2 className="t-h1">What are we baking for?</h2>
              <Link className="sec-head__more" href={menuHref}>All cakes</Link>
            </div>
            <ul className="occ">
              {occasions.map((o) => (
                <li key={o.id}>
                  <Link href={`/cakes/${o.slug}`}>
                    <span className="occ__img">
                      {o.image ? (
                        <Image src={img(o.image, 200, 200)} alt="" width={200} height={200} unoptimized />
                      ) : null}
                    </span>
                    <span className="occ__n">{o.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* The shop-now moment: the biggest photographs on the page, and the
          first two run double width so the grid is not a wall of equal squares. */}
      {bestsellers.length > 0 && (
        <section className="sec sec--cream">
          <div className="wrap">
            <div className="sec-head sec-head--rule">
              <h2 className="t-h1">This week&apos;s most ordered</h2>
              <Link className="sec-head__more" href={menuHref}>See all {store.categories.reduce((n, c) => n + c._count.products, 0)}</Link>
            </div>
            <div className="best">
              {bestsellers.slice(0, 10).map((p) => {
                const flavourPrices = parseJsonSafe<FlavourPrice[]>(p.flavourPrices, []);
                const price = fromPrice(
                  {
                    pricingStrategy: p.pricingStrategy,
                    basePrice: p.basePrice,
                    designCharge: p.designCharge,
                    base500gPrice: p.base500gPrice,
                    flavourPrices,
                  },
                  p.variants,
                );
                return (
                  <ProductCard
                    key={p.id}
                    p={{
                      name: p.name,
                      href: `${menuHref}/${p.slug}`,
                      image: firstImage(p.images),
                      price,
                      isFrom: p.pricingStrategy === "CUSTOM",
                      isBestseller: p.isBestseller,
                      isNew: p.isNew,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Theme cakes are two-thirds of the catalogue, so they get a dense
          mosaic of their own rather than a third identical rail. */}
      {themeTiles.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="sec-head sec-head--rule">
              <h2 className="t-h1">Theme cakes</h2>
              <Link className="sec-head__more" href="/themes">Every theme</Link>
            </div>
          </div>
          <div className="mosaic">
            {themeTiles.slice(0, 12).map((t, i) => (
              <Link className="mosaic__i" key={`${t.href}-${i}`} href={t.href}>
                {t.image ? (
                  <Image src={img(t.image, 320, 320)} alt="" width={320} height={320} unoptimized loading="lazy" />
                ) : null}
                <span>{t.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}


      <section className="sec">
        <div className="wrap">
          <div className="v5-band">
            <div className="v5-band__copy">
              <span className="kicker" style={{ color: "var(--rose-300)" }}>Your design, our kitchen</span>
              <h2 className="d2" style={{ margin: "12px 0 10px", color: "#fff" }}>Custom cakes</h2>
              <p>
                Send a reference photo. Pick any flavour, any size from 500&nbsp;g to 6&nbsp;kg.
                We quote within the hour and bake in 48.
              </p>
              <div className="v5-band__cta">
                <Link className="btn btn--rose" href={`/store/${store.slug}/custom-cakes`}>
                  Start a custom cake
                </Link>
                <a
                  className="btn btn--light"
                  href={`https://wa.me/91${store.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp us
                </a>
              </div>
            </div>
            <div className="v5-band__media">
              {heroImage ? (
                <Image src={img(heroImage, 760, 700)} alt="" width={760} height={700} unoptimized />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Six live categories, all of them cakes — a typographic index tells the
          truth about that better than twelve photographic tiles would. */}
      {store.categories.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="sec-head sec-head--rule">
              <h2 className="t-h2">The counter</h2>
            </div>
            <ul className="idx">
              {store.categories.map((c) => (
                <li key={c.id}>
                  <Link href={`${menuHref}?category=${c.slug}`}>
                    <span>{c.name}</span>
                    <i className="t-num">{c._count.products}</i>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="sec sec--cream">
        <div className="wrap">
          <dl className="facts">
            <div>
              <dt>Every single cake</dt>
              <dd>Eggless and pure vegetarian. No exceptions, no separate counter.</dd>
            </div>
            <div>
              <dt>Ordering today</dt>
              <dd>Same-day slots close {store.orderLeadHours} hours before delivery. Custom cakes need 48 hours.</dd>
            </div>
            <div>
              <dt>Where we bake</dt>
              <dd>{formatStoreAddress(store)}</dd>
            </div>
            <div>
              <dt>Talk to us</dt>
              <dd><a href={`tel:+91${store.phone}`}>+91 {store.phone}</a></dd>
            </div>
          </dl>
        </div>
      </section>

      <SiteFooter storeSlug={store.slug} phone={store.phone} logo={store.logo} address={formatStoreAddress(store)} />
    </>
  );
}
