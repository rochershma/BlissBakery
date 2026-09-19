// Counts DB image references that point at local files rather than Cloudinary.
const { PrismaClient } = require("@prisma/client");
const d = new PrismaClient();

const isLocal = (u) => typeof u === "string" && u.startsWith("/");

(async () => {
  const out = {};
  const products = await d.product.findMany({ select: { images: true } });
  let local = 0, cloud = 0;
  for (const r of products) {
    try { for (const u of JSON.parse(r.images || "[]")) isLocal(u) ? local++ : cloud++; } catch {}
  }
  out.productImages = { local, cloud };

  const store = await d.store.findFirst({ select: { logo: true } });
  out.storeLogo = store?.logo ?? null;

  for (const [name, model] of [["banners", d.banner], ["categories", d.category], ["occasions", d.occasion], ["themes", d.theme]]) {
    try {
      const rows = await model.findMany({ select: { image: true } });
      out[name] = { local: rows.filter((r) => isLocal(r.image)).length, total: rows.length };
    } catch { out[name] = "n/a"; }
  }

  // every distinct local path the app will need on disk
  const paths = new Set();
  for (const r of products) { try { for (const u of JSON.parse(r.images || "[]")) if (isLocal(u)) paths.add(u); } catch {} }
  for (const [, model] of [["b", d.banner], ["c", d.category], ["o", d.occasion], ["t", d.theme]]) {
    try { (await model.findMany({ select: { image: true } })).forEach((r) => isLocal(r.image) && paths.add(r.image)); } catch {}
  }
  if (isLocal(out.storeLogo)) paths.add(out.storeLogo);
  out.distinctLocalPaths = paths.size;
  out.samplePaths = [...paths].slice(0, 10);

  console.log(JSON.stringify(out, null, 1));
  await d.$disconnect();
})();
