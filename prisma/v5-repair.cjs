/**
 * v5 data repair. Idempotent — safe to re-run.
 * Runs against blissbakery_v5 only; the v2 database is never touched.
 */
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const CDN = "https://res.cloudinary.com/dvw9o0f8z/image/upload/";
const j = (s) => { try { return JSON.parse(s); } catch { return null; } };

// Merchandising shelves for "Shop by category". sourceTag drives which
// existing products get re-homed into each shelf.
const SHELVES = [
  { name: "Theme Cakes",    slug: "theme-cakes",    img: CDN + "v1781068470/blissbakery/themes/animal-theme-cake/oukrochhdwaq5zzmfmsp.jpg", match: (x) => (j(x.themeTags) || []).length > 0 },
  { name: "Occasion Cakes", slug: "occasion-cakes", img: CDN + "v1780870565/blissbakery/products/1780870565709-eq8rlm.jpg", match: (x) => (j(x.occasions) || []).length > 0 },
  { name: "Tiered Cakes",   slug: "tiered-cakes",   img: CDN + "v1780870068/blissbakery/products/1780870067938-w8yscb.jpg", match: (x) => (j(x.forWhom) || []).some((w) => /tier/i.test(w)) },
  { name: "Baby & Shower",  slug: "baby-shower",    img: CDN + "v1781180764/blissbakery/occasions/welcome-baby-girl/zomy8e5echuqzhhjjeu1.jpg", match: (x) => (j(x.forWhom) || []).some((w) => /baby/i.test(w)) },
  { name: "Bride & Groom",  slug: "bride-groom",    img: CDN + "v1780868578/blissbakery/products/1780868577786-bu50ho.jpg", match: (x) => (j(x.forWhom) || []).some((w) => /bride|groom/i.test(w)) },
  { name: "Heart & Shaped", slug: "heart-shaped",   img: CDN + "v1780872082/blissbakery/products/1780872081965-znm9x0.jpg", match: (x) => (j(x.forWhom) || []).some((w) => /heart|shape/i.test(w)) },
];

// Counter menu — no products yet, admin stocks these. Hidden until stocked.
const COUNTER = [
  { name: "Signature Cakes", slug: "signature-cakes", img: CDN + "v1780254128/blissbakery/products/black-forest-1.jpg" },
  { name: "Cheesecakes",     slug: "cheesecakes",     img: CDN + "v1780310565/blissbakery/categories/1780310565015-0yj6ew.jpg" },
  { name: "Pastries",        slug: "pastries",        img: CDN + "v1780324093/blissbakery/categories/1780324093195-jglktu.jpg" },
  { name: "Cookies",         slug: "cookies",         img: CDN + "v1780254118/blissbakery/products/Belgian-chocolate-chip-cookies-Tuileries-Patisserie-1658593452.jpg" },
  { name: "Brownies",        slug: "brownies",        img: CDN + "v1780254161/blissbakery/products/choco-chip-1.jpg" },
  { name: "Beverages",       slug: "beverages",       img: null },
];

(async () => {
  const store = await p.store.findFirst();
  if (!store) throw new Error("no store");
  const log = [];

  /* ---- 1. categories ---------------------------------------------------- */
  const all = [...SHELVES, ...COUNTER];
  const catIds = {};
  for (let i = 0; i < all.length; i++) {
    const c = all[i];
    const row = await p.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, image: c.img, sortOrder: i, isVisible: true, storeId: store.id },
      create: { name: c.name, slug: c.slug, image: c.img, sortOrder: i, isVisible: true, storeId: store.id },
    });
    catIds[c.slug] = row.id;
  }
  log.push(`categories upserted: ${all.length}`);

  /* ---- 2. re-home products into shelves ---------------------------------- */
  const prods = await p.product.findMany({ select: { id: true, themeTags: true, occasions: true, forWhom: true } });
  const moves = {};
  for (const x of prods) {
    // most specific shelf wins
    const shelf = [...SHELVES].reverse().find((s) => s.match(x)) || SHELVES[0];
    moves[shelf.slug] = moves[shelf.slug] || [];
    moves[shelf.slug].push(x.id);
  }
  for (const [slug, ids] of Object.entries(moves)) {
    for (let i = 0; i < ids.length; i += 200) {
      await p.product.updateMany({ where: { id: { in: ids.slice(i, i + 200) } }, data: { categoryId: catIds[slug] } });
    }
    log.push(`  ${slug}: ${ids.length}`);
  }

  /* ---- 3. hide empty categories ------------------------------------------ */
  for (const c of all) {
    const n = await p.product.count({ where: { categoryId: catIds[c.slug] } });
    await p.category.update({ where: { id: catIds[c.slug] }, data: { isVisible: n > 0 } });
  }

  /* ---- 4. drop the old auto-slug categories ------------------------------ */
  const stale = await p.category.findMany({ where: { slug: { contains: "-mq" } } });
  for (const s of stale) {
    const n = await p.product.count({ where: { categoryId: s.id } });
    if (n === 0) { await p.category.delete({ where: { id: s.id } }); log.push(`deleted stale category ${s.slug}`); }
  }

  /* ---- 5. taxonomy data bugs --------------------------------------------- */
  const fixed = await p.recipient.updateMany({ where: { slug: "1-tier-" }, data: { slug: "1-tier" } });
  if (fixed.count) log.push(`recipient slug "1-tier-" -> "1-tier": ${fixed.count}`);
  await p.product.updateMany({ where: { forWhom: { contains: '"1-tier-"' } }, data: {} }); // handled below

  const withBadTag = await p.product.findMany({ where: { forWhom: { contains: "1-tier-" } }, select: { id: true, forWhom: true } });
  for (const x of withBadTag) {
    const arr = (j(x.forWhom) || []).map((w) => (w === "1-tier-" ? "1-tier" : w));
    await p.product.update({ where: { id: x.id }, data: { forWhom: JSON.stringify([...new Set(arr)]) } });
  }
  if (withBadTag.length) log.push(`products retagged 1-tier-: ${withBadTag.length}`);

  /* ---- 6. theme/occasion images ------------------------------------------ */
  const OCC_IMG = {
    festival: CDN + "v1780872413/blissbakery/products/1780872413343-476dyz.jpg",
    "special-milestones": CDN + "v1780870433/blissbakery/products/1780870432807-zcccup.jpg",
  };
  for (const [slug, url] of Object.entries(OCC_IMG)) {
    const r = await p.occasion.updateMany({ where: { slug, image: null }, data: { image: url } });
    if (r.count) log.push(`occasion ${slug} image set`);
  }
  const THEME_IMG = {
    "kids-cakes": CDN + "v1781068442/blissbakery/themes/1st-birthday-cakes/vyag1rotxymg0kq488ca.jpg",
    "grown-up-cakes": CDN + "v1781074135/blissbakery/themes/gym-theme-cakes/p3vaptd4jnaze5ugae9u.jpg",
  };
  for (const [slug, url] of Object.entries(THEME_IMG)) {
    const r = await p.theme.updateMany({ where: { slug, image: null }, data: { image: url } });
    if (r.count) log.push(`theme ${slug} image set`);
  }

  /* ---- 7. hide themes with no products ----------------------------------- */
  const themes = await p.theme.findMany({ include: { tags: true } });
  for (const t of themes) {
    const slugs = t.tags.map((x) => x.slug);
    let n = 0;
    if (slugs.length) {
      const cands = await p.product.findMany({ where: { OR: slugs.map((s) => ({ themeTags: { contains: `"${s}"` } })) }, select: { id: true } });
      n = cands.length;
    }
    await p.theme.update({ where: { id: t.id }, data: { isActive: n > 0 } });
    if (n === 0) log.push(`theme ${t.slug} hidden (0 products)`);
  }

  /* ---- 8. bestsellers: genuine top 12 by order volume -------------------- */
  const top = await p.orderItem.groupBy({ by: ["productId"], _sum: { quantity: true }, where: { productId: { not: null } } });
  const ranked = top.filter((t) => t.productId).sort((a, b) => (b._sum.quantity || 0) - (a._sum.quantity || 0)).slice(0, 12);
  await p.product.updateMany({ data: { isBestseller: false } });
  if (ranked.length) {
    await p.product.updateMany({ where: { id: { in: ranked.map((r) => r.productId) } }, data: { isBestseller: true } });
    log.push(`bestsellers set from order volume: ${ranked.length}`);
  } else {
    const fallback = await p.product.findMany({ take: 12, orderBy: { basePrice: "desc" }, select: { id: true } });
    await p.product.updateMany({ where: { id: { in: fallback.map((f) => f.id) } }, data: { isBestseller: true } });
    log.push(`bestsellers fallback: ${fallback.length}`);
  }

  /* ---- 9. banners: give them copy so the hero can render text ------------ */
  const banners = await p.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  log.push(`active banners: ${banners.length} (titles left null — artwork already carries copy)`);

  console.log(log.join("\n"));
  const cats = await p.category.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  console.log("\nVISIBLE CATEGORIES:");
  cats.forEach((c) => console.log(`  ${c.slug.padEnd(18)} ${String(c._count.products).padStart(4)}  ${c.image ? "img" : "NO IMG"}`));
  process.exit(0);
})();
