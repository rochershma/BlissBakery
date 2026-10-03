import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { db as prisma } from "@/lib/db";
import { getCustomerStoreId } from "@/lib/customer-store";
import { fromPrice, type FlavourPrice } from "@/lib/pricing";
import { firstImage, imgFit } from "@/lib/img";
import { parseJsonSafe, formatStoreAddress } from "@/lib/utils";
import { SiteHeaderV5 } from "@/components/v5/site-header";
import { SiteFooter } from "@/components/v5/site-footer";
import { HeroSlider, type Slide } from "@/components/v5/hero-slider";
import { Rail } from "@/components/v5/rail";
import { Tile } from "@/components/v5/tile";
import { ProductCard } from "@/components/v5/product-card";
import { IconLeaf, IconTruck, IconClock, IconBag, IconCake, IconChevR } from "@/components/v5/icons";
import { StorePicker } from "@/components/v5/store-picker";
import { navLinks } from "@/lib/nav";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  noStore();

  const store = await prisma.store.findFirst({
    where: { id: await getCustomerStoreId() },
    include: {
      categories: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } },
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
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
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
  // The admin-set custom cake image; a stable fallback so it never shuffles between visits.
  const customImage = store.customCakeImage || bestsellers.map((b) => firstImage(b.images)).find(Boolean) || null;
  const customHref = `/store/${store.slug}/custom-cakes`;

  return (
    <>
      <SiteHeaderV5 storeSlug={store.slug} storeName={store.name} storeCity={store.city} logo={store.logo} nav={nav} pincode={store.pincode} />

      <h1 className="sr-only">
        Bliss Bakery — 100% vegetarian and eggless cakes in {store.city}
      </h1>

      <div className="wrap home__here">
        <StorePicker storeSlug={store.slug} storeCity={store.city} pincode={store.pincode} variant="strip" />
      </div>

      {slides.length > 0 && (
        <section className="sec" style={{ paddingTop: 12, paddingBottom: 0 }}>
          <div className="wrap">
            <HeroSlider slides={slides} />
            <div className="herobar">
              <div className="herobar__cta">
                <Link className="hcta hcta--main" href={menuHref}>
                  <span className="hcta__ic"><IconBag /></span>
                  <span className="hcta__tx"><b>Order now</b><small>Ready-made cakes</small></span>
                  <IconChevR className="hcta__go" />
                </Link>
                <Link className="hcta hcta--alt" href={customHref}>
                  <span className="hcta__ic"><IconCake /></span>
                  <span className="hcta__tx"><b>Custom cake</b><small>Your own design</small></span>
                  <IconChevR className="hcta__go" />
                </Link>
              </div>
              <div className="herobar__usp">
                <div><IconLeaf /><span>100% eggless</span></div>
                <div><IconTruck /><span>Same-day delivery</span></div>
                <div><IconClock /><span>Baked freshly</span></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {store.categories.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="kicker">Start here</span>
                <h2 className="d2" style={{ marginTop: 8 }}>Shop by category</h2>
              </div>
            </div>
            <Rail variant="tiles" itemWidth={196} className="rail--grid">
              {store.categories.map((c, i) => (
                <Tile
                  key={c.id}
                  eager={i < 4}
                  data={{
                    name: c.name,
                    href: `${menuHref}?category=${c.slug}`,
                    image: c.image,
                    glyph: c.slug === "beverages" ? "cup" : "cake",
                  }}
                />
              ))}
            </Rail>
          </div>
        </section>
      )}

      {occasions.length > 0 && (
        <section className="sec sec--cream">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="kicker">Made to order</span>
                <h2 className="d2" style={{ marginTop: 8 }}>Shop by occasion</h2>
              </div>
            </div>
            <Rail variant="tiles" itemWidth={196}>
              {occasions.map((o) => (
                <Tile key={o.id} data={{ name: o.name, href: `/cakes/${o.slug}`, image: o.image }} />
              ))}
            </Rail>
          </div>
        </section>
      )}

      {themeTiles.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="kicker">Made to order</span>
                <h2 className="d2" style={{ marginTop: 8 }}>Shop by theme</h2>
              </div>
            </div>
            <Rail variant="tiles" itemWidth={196}>
              {themeTiles.map((t, i) => (
                <Tile key={`${t.href}-${i}`} data={t} />
              ))}
            </Rail>
          </div>
        </section>
      )}

      {bestsellers.length > 0 && (
        <section className="sec sec--rose">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="kicker">Most ordered</span>
                <h2 className="d2" style={{ marginTop: 8 }}>Bestsellers</h2>
              </div>
              <Link className="btn btn--rose btn--sm" href={menuHref}>See all</Link>
            </div>
            <Rail itemWidth={212}>
              {bestsellers.map((p) => {
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
                      // the section is already titled Bestsellers
                      isBestseller: false,
                      isNew: false,
                    }}
                  />
                );
              })}
            </Rail>
          </div>
        </section>
      )}

      <section className="sec">
        <div className="wrap">
          <Link className="ccband" href={customHref}>
            <div className="ccband__media">
              {customImage ? (
                <Image src={imgFit(customImage, 1200)} alt="A custom designed cake" width={1200} height={900} unoptimized loading="lazy" />
              ) : null}
            </div>
            <div className="ccband__copy">
              <span className="ccband__script">Made just for you</span>
              <h2 className="d2">Design your custom cake</h2>
              <p>Have a design in mind? Share your inspiration and create a cake that&apos;s uniquely yours.</p>
              <span className="btn btn--rose ccband__cta">Start designing <IconChevR /></span>
            </div>
          </Link>
        </div>
      </section>

      <SiteFooter storeSlug={store.slug} phone={store.phone} logo={store.logo} address={formatStoreAddress(store)} />
    </>
  );
}
