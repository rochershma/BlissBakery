import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Collection } from "@/components/v5/collection";
import { SiteHeaderV5 } from "@/components/v5/site-header";
import { SiteFooter } from "@/components/v5/site-footer";
import { loadProducts, toCards, buildGroups, storeFlavours } from "@/lib/collection-data";
import { formatStoreAddress } from "@/lib/utils";
import { navLinks } from "@/lib/nav";

export const dynamic = "force-dynamic";

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { slug } = await params;
  const { category } = await searchParams;

  const store = await db.store.findUnique({
    where: { slug },
    include: { categories: { where: { isVisible: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!store) notFound();

  const active = category ? store.categories.find((c) => c.slug === category) : null;
  const menuHref = `/store/${store.slug}/menu`;

  const rows = await loadProducts(store.id, active ? { categoryId: active.id } : {}, 600);
  const cards = toCards(rows, menuHref);
  const flavours = await storeFlavours();
  const nav = await navLinks(store.slug);

  const groups = buildGroups({
    flavours,
    withShape: true,
    extra: store.categories.length > 1 && !active
      ? [{
          key: "category",
          label: "Category",
          type: "check" as const,
          options: [],
        }]
      : [],
  }).filter((g) => g.options.length > 0);

  return (
    <>
      <SiteHeaderV5 storeSlug={store.slug} storeName={store.name} storeCity={store.city} logo={store.logo} nav={nav} pincode={store.pincode} />
      <Collection
        title={active ? active.name : "All cakes & bakes"}
        subtitle={
          active
            ? `${active.name} from Bliss Bakery — eggless, made to order and delivered across ${store.city}.`
            : `Every cake, pastry and bake we make. 100% eggless, delivered the same evening across ${store.city}.`
        }
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Shop by category", href: menuHref },
          ...(active ? [{ label: active.name }] : [{ label: "All cakes" }]),
        ]}
        subTagLabel={!active && store.categories.length ? "Browse a category" : undefined}
        subTags={
          !active
            ? store.categories.map((c) => ({ slug: c.slug, name: c.name, image: c.image }))
            : []
        }
        groups={groups}
        products={cards}
      />
      <SiteFooter storeSlug={store.slug} phone={store.phone} logo={store.logo} address={formatStoreAddress(store)} />
    </>
  );
}
