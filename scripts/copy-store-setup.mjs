// One-off: bring a new outlet's storefront setup across from an established
// one — banners, add-ons, occasion and theme rails, plus any store-level
// defaults the target has left unset. Mirrors copyStoreSetup in
// src/lib/copy-menu.ts so it can run on the server without a TS toolchain.
//   node --env-file=.env scripts/copy-store-setup.mjs <from-slug> <to-slug>
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
  if (!fromSlug || !toSlug) throw new Error("usage: copy-store-setup.mjs <from-slug> <to-slug>");

  const [from, to] = await Promise.all([
    db.store.findUnique({ where: { slug: fromSlug } }),
    db.store.findUnique({ where: { slug: toSlug } }),
  ]);
  if (!from) throw new Error(`no store ${fromSlug}`);
  if (!to) throw new Error(`no store ${toSlug}`);
  if (from.id === to.id) throw new Error("source and target are the same outlet");

  const [banners, addOns, occasions, themes] = await Promise.all([
    db.banner.count({ where: { storeId: to.id } }),
    db.storeAddOn.count({ where: { storeId: to.id } }),
    db.occasion.count({ where: { storeId: to.id } }),
    db.theme.count({ where: { storeId: to.id } }),
  ]);

  if (banners === 0) {
    const src = await db.banner.findMany({ where: { storeId: from.id }, orderBy: { sortOrder: "asc" } });
    for (const b of src) {
      await db.banner.create({
        data: {
          title: b.title, subtitle: b.subtitle, ctaText: b.ctaText, ctaLink: b.ctaLink,
          mediaUrl: b.mediaUrl, mobileMediaUrl: b.mobileMediaUrl, mediaType: b.mediaType,
          linkUrl: b.linkUrl, sortOrder: b.sortOrder, isActive: b.isActive, storeId: to.id,
        },
      });
    }
    console.log(`banners   ${src.length}`);
  } else console.log(`banners   skipped (${banners} already)`);

  if (addOns === 0) {
    const src = await db.storeAddOn.findMany({ where: { storeId: from.id }, orderBy: { sortOrder: "asc" } });
    for (const a of src) {
      await db.storeAddOn.create({
        data: {
          name: a.name, price: a.price, image: a.image, category: a.category,
          isActive: a.isActive, sortOrder: a.sortOrder, storeId: to.id,
        },
      });
    }
    console.log(`add-ons   ${src.length}`);
  } else console.log(`add-ons   skipped (${addOns} already)`);

  if (occasions === 0) {
    const src = await db.occasion.findMany({
      where: { storeId: from.id }, include: { recipients: true }, orderBy: { sortOrder: "asc" },
    });
    for (const o of src) {
      const slug = await freeSlug(o.slug, async (s) =>
        Boolean(await db.occasion.findUnique({ where: { slug: s }, select: { id: true } })));
      await db.occasion.create({
        data: {
          name: o.name, slug, subtitle: o.subtitle, image: o.image,
          sortOrder: o.sortOrder, isActive: o.isActive, storeId: to.id,
          recipients: {
            create: o.recipients.map((r) => ({
              name: r.name, slug: r.slug, image: r.image, sortOrder: r.sortOrder, isActive: r.isActive,
            })),
          },
        },
      });
    }
    console.log(`occasions ${src.length}`);
  } else console.log(`occasions skipped (${occasions} already)`);

  if (themes === 0) {
    const src = await db.theme.findMany({
      where: { storeId: from.id }, include: { tags: true }, orderBy: { sortOrder: "asc" },
    });
    for (const t of src) {
      const slug = await freeSlug(t.slug, async (s) =>
        Boolean(await db.theme.findUnique({ where: { slug: s }, select: { id: true } })));
      await db.theme.create({
        data: {
          name: t.name, slug, subtitle: t.subtitle, image: t.image,
          sortOrder: t.sortOrder, isActive: t.isActive, storeId: to.id,
          tags: {
            create: t.tags.map((g) => ({
              name: g.name, slug: g.slug, image: g.image, sortOrder: g.sortOrder, isActive: g.isActive,
            })),
          },
        },
      });
    }
    console.log(`themes    ${src.length}`);
  } else console.log(`themes    skipped (${themes} already)`);

  const fill = {};
  const keys = [
    "deliveryRadius", "minDeliveryOrder", "deliveryCharge", "packagingCharge",
    "servicePincodes", "deliverySlots", "deliveryTiers", "defaultFlavours",
    "defaultFlavourPrices", "defaultCustomSizes", "defaultBase500gPrice",
    "customCakeImage", "logo", "tagline", "operatingHours",
  ];
  for (const k of keys) if (to[k] === null && from[k] !== null) fill[k] = from[k];
  if (Object.keys(fill).length > 0) {
    await db.store.update({ where: { id: to.id }, data: fill });
    console.log(`defaults  ${Object.keys(fill).join(", ")}`);
  } else console.log("defaults  nothing to fill");

  console.log(`\ndone: ${to.name} set up from ${from.name}`);
}

main()
  .catch((e) => {
    console.error("FAILED:", e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
