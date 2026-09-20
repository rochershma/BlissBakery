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

/**
 * The rest of an outlet's setup: storefront banners, occasion and theme rails,
 * the add-on shelf and the store-level defaults used by the custom-cake builder.
 * Without these a copied menu still renders a bare homepage.
 *
 * Each section is skipped when the target already has rows of that kind, and
 * store defaults only fill in fields the target has left unset — so this never
 * overwrites anything the new outlet has already decided for itself.
 */
export async function copyStoreSetup(fromStoreId: string, toStoreId: string) {
  if (fromStoreId === toStoreId) return { banners: 0, addOns: 0, occasions: 0, themes: 0, defaults: false };

  const [from, to] = await Promise.all([
    db.store.findUnique({ where: { id: fromStoreId } }),
    db.store.findUnique({ where: { id: toStoreId } }),
  ]);
  if (!from || !to) return { banners: 0, addOns: 0, occasions: 0, themes: 0, defaults: false };

  const [banners, addOns, occasions, themes] = await Promise.all([
    db.banner.count({ where: { storeId: toStoreId } }),
    db.storeAddOn.count({ where: { storeId: toStoreId } }),
    db.occasion.count({ where: { storeId: toStoreId } }),
    db.theme.count({ where: { storeId: toStoreId } }),
  ]);

  const result = { banners: 0, addOns: 0, occasions: 0, themes: 0, defaults: false };

  if (banners === 0) {
    const src = await db.banner.findMany({ where: { storeId: fromStoreId }, orderBy: { sortOrder: "asc" } });
    for (const b of src) {
      await db.banner.create({
        data: {
          title: b.title, subtitle: b.subtitle, ctaText: b.ctaText, ctaLink: b.ctaLink,
          mediaUrl: b.mediaUrl, mobileMediaUrl: b.mobileMediaUrl, mediaType: b.mediaType,
          linkUrl: b.linkUrl, sortOrder: b.sortOrder, isActive: b.isActive, storeId: toStoreId,
        },
      });
      result.banners++;
    }
  }

  if (addOns === 0) {
    const src = await db.storeAddOn.findMany({ where: { storeId: fromStoreId }, orderBy: { sortOrder: "asc" } });
    for (const a of src) {
      await db.storeAddOn.create({
        data: {
          name: a.name, price: a.price, image: a.image, category: a.category,
          isActive: a.isActive, sortOrder: a.sortOrder, storeId: toStoreId,
        },
      });
      result.addOns++;
    }
  }

  if (occasions === 0) {
    const src = await db.occasion.findMany({
      where: { storeId: fromStoreId },
      include: { recipients: true },
      orderBy: { sortOrder: "asc" },
    });
    for (const o of src) {
      const slug = await freeSlug(o.slug, async (s) =>
        Boolean(await db.occasion.findUnique({ where: { slug: s }, select: { id: true } })));
      await db.occasion.create({
        data: {
          name: o.name, slug, subtitle: o.subtitle, image: o.image,
          sortOrder: o.sortOrder, isActive: o.isActive, storeId: toStoreId,
          recipients: {
            create: o.recipients.map((r) => ({
              name: r.name, slug: r.slug, image: r.image,
              sortOrder: r.sortOrder, isActive: r.isActive,
            })),
          },
        },
      });
      result.occasions++;
    }
  }

  if (themes === 0) {
    const src = await db.theme.findMany({
      where: { storeId: fromStoreId },
      include: { tags: true },
      orderBy: { sortOrder: "asc" },
    });
    for (const t of src) {
      const slug = await freeSlug(t.slug, async (s) =>
        Boolean(await db.theme.findUnique({ where: { slug: s }, select: { id: true } })));
      await db.theme.create({
        data: {
          name: t.name, slug, subtitle: t.subtitle, image: t.image,
          sortOrder: t.sortOrder, isActive: t.isActive, storeId: toStoreId,
          tags: {
            create: t.tags.map((g) => ({
              name: g.name, slug: g.slug, image: g.image,
              sortOrder: g.sortOrder, isActive: g.isActive,
            })),
          },
        },
      });
      result.themes++;
    }
  }

  const fill: Record<string, unknown> = {};
  const keys = [
    "deliveryRadius", "minDeliveryOrder", "deliveryCharge", "packagingCharge",
    "servicePincodes", "deliverySlots", "deliveryTiers", "defaultFlavours",
    "defaultFlavourPrices", "defaultCustomSizes", "defaultBase500gPrice",
    "customCakeImage", "logo", "tagline", "operatingHours",
  ] as const;
  for (const k of keys) {
    if (to[k] === null && from[k] !== null) fill[k] = from[k];
  }
  if (Object.keys(fill).length > 0) {
    await db.store.update({ where: { id: toStoreId }, data: fill });
    result.defaults = true;
  }

  return result;
}
