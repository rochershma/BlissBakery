import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCustomerStoreId } from "@/lib/customer-store";
import { Collection } from "@/components/v5/collection";
import { SiteHeaderV5 } from "@/components/v5/site-header";
import { SiteFooter } from "@/components/v5/site-footer";
import { loadProducts, toCards, buildGroups, storeFlavours } from "@/lib/collection-data";
import { navLinks } from "@/lib/nav";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await db.theme.findUnique({ where: { slug } });
  return { title: t ? t.name : "Theme cakes" };
}

export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [store, theme] = await Promise.all([
    db.store.findFirst({ where: { id: await getCustomerStoreId() } }),
    db.theme.findUnique({
      where: { slug },
      include: { tags: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    }),
  ]);
  if (!store || !theme || !theme.isActive) notFound();

  const menuHref = `/store/${store.slug}/menu`;
  const tagSlugs = theme.tags.map((t) => t.slug);

  const rows = tagSlugs.length
    ? await loadProducts(store.id, { OR: tagSlugs.map((s) => ({ themeTags: { contains: `"${s}"` } })) }, 800)
    : [];
  const cards = toCards(rows, menuHref);
  const flavours = await storeFlavours();
  const nav = await navLinks(store.slug);

  // Theme sub-tags are the sub-axis here — only show ones that have stock.
  const present = new Set(cards.flatMap((c) => c._tags));
  const subTags = theme.tags
    .filter((t) => present.has(t.slug))
    .map((t) => ({ slug: t.slug, name: t.name, image: t.image }));

  const groups = buildGroups({ flavours });

  return (
    <>
      <SiteHeaderV5 storeSlug={store.slug} storeName={store.name} storeCity={store.city} logo={store.logo} nav={nav} pincode={store.pincode} />
      <Collection
        title={theme.name}
        subtitle={theme.subtitle ?? "Characters, colours and hobbies. Every design can be rebuilt in any flavour and size."}
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop by theme", href: "/" }, { label: theme.name }]}
        subTagLabel={subTags.length ? "Pick a theme" : undefined}
        subTags={subTags}
        groups={groups}
        products={cards}
      />
      <SiteFooter storeSlug={store.slug} phone={store.phone} logo={store.logo} />
    </>
  );
}
