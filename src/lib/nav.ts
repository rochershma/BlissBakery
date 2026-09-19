import { db } from "@/lib/db";
import type { NavLink } from "@/components/v5/site-header";

/** Top nav: the live occasions plus the two biggest themes. */
export async function navLinks(storeSlug: string): Promise<NavLink[]> {
  const store = await db.store.findUnique({ where: { slug: storeSlug }, select: { id: true } });
  if (!store) return [];

  const [occasions, themes] = await Promise.all([
    db.occasion.findMany({
      where: { isActive: true, storeId: store.id },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true },
      take: 5,
    }),
    db.theme.findMany({
      where: { isActive: true, storeId: store.id },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true },
      take: 2,
    }),
  ]);

  return [
    ...occasions.map((o) => ({ label: o.name.replace(/ Cakes$/i, ""), href: `/cakes/${o.slug}` })),
    ...themes.map((t) => ({ label: t.name.replace(/ Cakes$/i, ""), href: `/themes/${t.slug}` })),
  ];
}
