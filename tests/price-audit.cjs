// End-to-end price agreement check.
// Computes the price the PDP would display, then asks the real
// /api/cart/verify-prices endpoint whether it agrees. Any disagreement means
// the customer is shown one price and charged another.
const { PrismaClient } = require("@prisma/client");
const d = new PrismaClient();
const BASE = process.env.BASE || "http://localhost:3005";

const parse = (s, f) => { try { return typeof s === "string" ? JSON.parse(s) : (s ?? f); } catch { return f; } };

// mirrors src/lib/pricing.ts — the single formula both sides now use
const parseWeightKg = (name) => {
  const m = name.match(/([\d.]+)\s*(kg|g\b|gm|gram)/i);
  if (!m) return 0.5;
  const n = parseFloat(m[1]);
  if (!isFinite(n)) return 0.5;
  return /kg/i.test(m[2]) ? n : n / 1000;
};
const customPrice = (per500, kg, design) => Math.round(per500 * kg * 2 + design);

(async () => {
  const products = await d.product.findMany({
    where: { pricingStrategy: "CUSTOM", isAvailable: true },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
    take: Number(process.env.LIMIT || 150),
  });

  const items = [];
  const meta = [];
  for (const p of products) {
    const fps = parse(p.flavourPrices, []);
    const flavours = parse(p.flavours, []);
    if (!flavours.length || !p.variants.length) continue;
    const sizes = [...new Set([p.variants[0], p.variants[Math.floor(p.variants.length / 2)], p.variants.at(-1)].filter(Boolean))];
    for (const v of sizes) {
      for (const f of flavours) {
        const per500 = fps.find((x) => x.name === f)?.price500g ?? p.base500gPrice ?? 300;
        const shown = customPrice(per500, parseWeightKg(v.name), p.designCharge ?? 0);
        items.push({ productId: p.id, variantName: v.name, flavour: f, unitPrice: shown });
        meta.push({ slug: p.slug, shown });
      }
    }
  }

  let bad = 0;
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50);
    const res = await fetch(`${BASE}/api/cart/verify-prices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: batch }),
    });
    const json = await res.json();
    for (const u of json.updates || []) {
      const k = batch.findIndex((x) => x.productId === u.productId && x.variantName === u.variantName && x.flavour === u.flavour);
      const m = meta[i + k] || {};
      bad++;
      if (bad <= 10) console.log(`  MISMATCH ${m.slug} "${u.variantName}" / ${u.flavour}: shown ${m.shown} server ${u.correctPrice}`);
    }
  }

  console.log(`\nchecked ${items.length} flavour x size combos across ${products.length} custom products`);
  console.log(bad ? `FAIL - ${bad} price disagreements` : "PASS - displayed price matches server price everywhere");
  await d.$disconnect();
  process.exit(bad ? 1 : 0);
})();
