import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { parseJsonSafe } from "@/lib/utils";
import { allImages } from "@/lib/img";
import type { FlavourPrice } from "@/lib/pricing";
import { SiteHeaderV5 } from "@/components/v5/site-header";
import { SiteFooter } from "@/components/v5/site-footer";
import { Rail } from "@/components/v5/rail";
import { ProductCard } from "@/components/v5/product-card";
import { navLinks } from "@/lib/nav";
import { loadProducts, toCards } from "@/lib/collection-data";
import { ProductDetail, type PdpProduct } from "./product-detail";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ productSlug: string }> }) {
  const { productSlug } = await params;
  const p = await db.product.findUnique({ where: { slug: productSlug }, select: { name: true, shortDesc: true } });
  return { title: p?.name ?? "Cake", description: p?.shortDesc ?? undefined };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;

  const [store, product] = await Promise.all([
    db.store.findUnique({ where: { slug } }),
    db.product.findUnique({
      where: { slug: productSlug },
      include: { variants: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } }, category: true },
    }),
  ]);
  if (!store || !product || !product.isAvailable) notFound();

  const menuHref = `/store/${store.slug}/menu`;
  const occasions = parseJsonSafe<string[]>(product.occasions, []);
  const themeTags = parseJsonSafe<string[]>(product.themeTags, []);
  const storeFlav = parseJsonSafe<string[]>(store.defaultFlavours, []);

  const pdp: PdpProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDesc: product.shortDesc,
    ingredients: product.ingredients,
    images: allImages(product.images),
    basePrice: product.basePrice,
    mrpPrice: product.mrpPrice,
    isBestseller: product.isBestseller,
    isNew: product.isNew,
    categoryName: product.category?.name ?? null,
    pricingStrategy: product.pricingStrategy,
    designCharge: product.designCharge ?? 0,
    base500gPrice: product.base500gPrice,
    defaultFlavour: product.defaultFlavour,
    flavours: parseJsonSafe<string[]>(product.flavours, storeFlav),
    flavourPrices: parseJsonSafe<FlavourPrice[]>(product.flavourPrices, []),
    servingInfo: product.servingInfo,
    variants: product.variants.map((v) => ({ id: v.id, name: v.name, serves: v.serves, price: v.price })),
  };

  // Related: same occasion first, then same theme tag, then same category.
  const relWhere = occasions.length
    ? { OR: occasions.map((o) => ({ occasions: { contains: `"${o}"` } })) }
    : themeTags.length
      ? { OR: themeTags.map((t) => ({ themeTags: { contains: `"${t}"` } })) }
      : { categoryId: product.categoryId };

  const relRows = await loadProducts(store.id, { ...relWhere, NOT: { id: product.id } }, 14);
  const related = toCards(relRows, menuHref);
  const nav = await navLinks(store.slug);

  const relTitle = occasions.length
    ? `More ${occasions[0].replace(/-/g, " ")} cakes`
    : product.category
      ? `More ${product.category.name.toLowerCase()}`
      : "You may also like";

  return (
    <>
      <SiteHeaderV5 storeSlug={store.slug} storeName={store.name} storeCity={store.city} logo={store.logo} nav={nav} pincode={store.pincode} />

      <div className="wrap" style={{ paddingTop: 18 }}>
        <p className="t-small v5crumbs">
          <span><Link href="/">Home</Link><i>/</i></span>
          <span><Link href={menuHref}>Menu</Link><i>/</i></span>
          <span><span>{product.name}</span></span>
        </p>
      </div>

      <div className="wrap">
        <ProductDetail
          product={pdp}
          storeSlug={store.slug}
          deliveryCharge={store.deliveryCharge ?? 30}
          freeOver={999}
        />
      </div>

      {related.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <span className="kicker">You may also like</span>
                <h2 className="d2" style={{ marginTop: 8, textTransform: "capitalize" }}>{relTitle}</h2>
              </div>
            </div>
            <Rail itemWidth={212}>
              {related.map((p) => <ProductCard key={p.href} p={p} />)}
            </Rail>
          </div>
        </section>
      )}

      <SiteFooter storeSlug={store.slug} phone={store.phone} logo={store.logo} />
    </>
  );
}
