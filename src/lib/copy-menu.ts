import { db } from "@/lib/db";

/** Slugs are globally unique, so a copied row needs its own. */
async function freeSlug(base: string, taken: (s: string) => Promise<boolean>) {
  const root = base.replace(/-copy(-\d+)?$/, "").slice(0, 50);
  let candidate = root;
  for (let n = 2; await taken(candidate); n++) candidate = `${root}-${n}`;
  return candidate;
}

/**
 * Clones one outlet's menu into another so a new outlet doesn't open empty.
 *
 * Products are copied, not shared: each outlet then prices and hides items on
 * its own. Categories already present in the target are skipped, so running
 * this twice will not duplicate a menu.
 */
export async function copyMenu(fromStoreId: string, toStoreId: string) {
  if (fromStoreId === toStoreId) return { categories: 0, products: 0 };

  const [source, target] = await Promise.all([
    db.category.findMany({
      where: { storeId: fromStoreId },
      include: { products: { include: { variants: true, addOns: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    db.category.findMany({ where: { storeId: toStoreId }, select: { name: true } }),
  ]);

  const existing = new Set(target.map((c) => c.name.toLowerCase()));
  let categories = 0;
  let products = 0;

  for (const cat of source) {
    if (existing.has(cat.name.toLowerCase())) continue;

    const catSlug = await freeSlug(cat.slug, async (s) =>
      Boolean(await db.category.findUnique({ where: { slug: s }, select: { id: true } })));

    const created = await db.category.create({
      data: {
        name: cat.name,
        slug: catSlug,
        image: cat.image,
        sortOrder: cat.sortOrder,
        isVisible: cat.isVisible,
        storeId: toStoreId,
      },
    });
    categories++;

    for (const p of cat.products) {
      const slug = await freeSlug(p.slug, async (s) =>
        Boolean(await db.product.findUnique({ where: { slug: s }, select: { id: true } })));

      await db.product.create({
        data: {
          name: p.name,
          slug,
          description: p.description,
          shortDesc: p.shortDesc,
          basePrice: p.basePrice,
          mrpPrice: p.mrpPrice,
          images: p.images,
          isBestseller: p.isBestseller,
          isNew: p.isNew,
          isFeatured: p.isFeatured,
          isAvailable: p.isAvailable,
          ingredients: p.ingredients,
          occasions: p.occasions,
          themes: p.themes,
          themeTags: p.themeTags,
          forWhom: p.forWhom,
          flavours: p.flavours,
          pricingStrategy: p.pricingStrategy,
          flavourPrices: p.flavourPrices,
          designCharge: p.designCharge,
          base500gPrice: p.base500gPrice,
          defaultFlavour: p.defaultFlavour,
          servingInfo: p.servingInfo,
          categoryId: created.id,
          variants: {
            create: p.variants.map((v) => ({
              name: v.name,
              serves: v.serves,
              price: v.price,
              isAvailable: v.isAvailable,
            })),
          },
          addOns: {
            create: p.addOns.map((a) => ({
              name: a.name,
              price: a.price,
              isAvailable: a.isAvailable,
            })),
          },
        },
      });
      products++;
    }
  }

  return { categories, products };
}
