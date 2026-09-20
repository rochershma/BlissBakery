// One-off: clone one outlet's menu into another. Mirrors src/lib/copy-menu.ts
// so it can run directly on the server without a TypeScript toolchain.
//   node --env-file=.env scripts/copy-menu.mjs <from-slug> <to-slug>
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const [fromSlug, toSlug] = process.argv.slice(2);

async function freeSlug(base, taken) {
  const root = base.replace(/-copy(-\d+)?$/, "").slice(0, 50);
  let candidate = root;
  for (let n = 2; await taken(candidate); n++) candidate = `${root}-${n}`;
  return candidate;
}

async function main() {
  if (!fromSlug || !toSlug) throw new Error("usage: copy-menu.mjs <from-slug> <to-slug>");

  const [from, to] = await Promise.all([
    db.store.findUnique({ where: { slug: fromSlug } }),
    db.store.findUnique({ where: { slug: toSlug } }),
  ]);
  if (!from) throw new Error(`no store ${fromSlug}`);
  if (!to) throw new Error(`no store ${toSlug}`);
  if (from.id === to.id) throw new Error("source and target are the same outlet");

  const [source, existingCats] = await Promise.all([
    db.category.findMany({
      where: { storeId: from.id },
      include: { products: { include: { variants: true, addOns: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    db.category.findMany({ where: { storeId: to.id }, select: { name: true } }),
  ]);

  const existing = new Set(existingCats.map((c) => c.name.toLowerCase()));
  let categories = 0;
  let products = 0;

  for (const cat of source) {
    if (existing.has(cat.name.toLowerCase())) {
      console.log(`skip  ${cat.name} (already in ${to.name})`);
      continue;
    }

    const catSlug = await freeSlug(cat.slug, async (s) =>
      Boolean(await db.category.findUnique({ where: { slug: s }, select: { id: true } })));

    const created = await db.category.create({
      data: {
        name: cat.name,
        slug: catSlug,
        image: cat.image,
        sortOrder: cat.sortOrder,
        isVisible: cat.isVisible,
        storeId: to.id,
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
    console.log(`copy  ${cat.name} -> ${cat.products.length} products`);
  }

  console.log(`\ndone: ${categories} categories, ${products} products copied into ${to.name}`);
}

main()
  .catch((e) => {
    console.error("FAILED:", e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
