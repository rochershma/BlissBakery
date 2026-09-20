import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCustomerStoreId } from "@/lib/customer-store";
import { Collection } from "@/components/v5/collection";
import { SiteHeaderV5 } from "@/components/v5/site-header";
import { SiteFooter } from "@/components/v5/site-footer";
import { loadProducts, toCards, buildGroups, storeFlavours } from "@/lib/collection-data";
import { navLinks } from "@/lib/nav";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ occasion: string }> }) {
  const { occasion } = await params;
  const o = await db.occasion.findUnique({ where: { slug: occasion } });
  return { title: o ? o.name : "Cakes" };
}

export default async function OccasionPage({ params }: { params: Promise<{ occasion: string }> }) {
  const { occasion } = await params;

  const [store, occ] = await Promise.all([
    db.store.findFirst({ where: { id: await getCustomerStoreId() } }),
    db.occasion.findUnique({
      where: { slug: occasion },
      include: { recipients: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    }),
  ]);
  if (!store || !occ || !occ.isActive) notFound();

  const menuHref = `/store/${store.slug}/menu`;
  const rows = await loadProducts(store.id, { occasions: { contains: `"${occ.slug}"` } }, 600);
  const cards = toCards(rows, menuHref);
  const flavours = await storeFlavours();
  const nav = await navLinks(store.slug);

  // Recipients are the occasion's own sub-axis — lead with them.
  const present = new Set(cards.flatMap((c) => c._tags));
  const subTags = occ.recipients
    .filter((r) => present.has(r.slug))
    .map((r) => ({ slug: r.slug, name: r.name, image: r.image }));

  const groups = buildGroups({ flavours, withShape: true });

  return (
    <>
      <SiteHeaderV5 storeSlug={store.slug} storeName={store.name} storeCity={store.city} logo={store.logo} nav={nav} pincode={store.pincode} />
      <Collection
        title={occ.name}
        subtitle={occ.subtitle ?? `Made to order and decorated by hand. Pick a design — flavour and size come next.`}
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop by occasion", href: "/" }, { label: occ.name }]}
        subTagLabel={subTags.length ? "Who is it for?" : undefined}
        subTags={subTags}
        groups={groups}
        products={cards}
      />
      <SiteFooter storeSlug={store.slug} phone={store.phone} logo={store.logo} />
    </>
  );
}
