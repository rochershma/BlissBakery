// Proves the order total is right when the first cake has quantity > 1 and the
// basket carries shelf add-ons: add-ons are charged once, not per cake.
const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");
const { adminContext } = require("./_session.cjs");
const db = new PrismaClient();
const BASE = process.env.BASE || "http://localhost:3005";

const out = [];
const check = (ok, n, d = "") => { out.push(ok); console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${d ? " - " + d : ""}`); };

(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await adminContext(browser, BASE);
  const api = (p, o) => page.evaluate(async ([p, o]) => {
    const r = await fetch(p, o || undefined); let b = null; try { b = await r.json(); } catch {}
    return { status: r.status, body: b };
  }, [p, o]);
  const post = (p, payload) => api(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  const store = await db.store.findFirst({ where: { slug: "kuchaman-city" } });
  const cfg = await api("/api/store/config");
  const slot = (cfg.body?.deliverySlots ?? []).find((s) => s.active !== false)?.label ?? "10am - 1pm";
  const shelf = (cfg.body?.addOns ?? [])[0];
  const product = await db.product.findFirst({ where: { isAvailable: true, category: { storeId: store.id }, variants: { some: {} } }, include: { variants: true } });
  const v = product.variants[0];

  check(Boolean(shelf), "store has a shelf add-on to test with", shelf?.name);
  if (!shelf) { await browser.close(); await db.$disconnect(); process.exit(1); }

  // 2 cakes + 1 shelf add-on. Expect itemTotal = price*2 + addon (once).
  const res = await post("/api/orders/create", {
    storeSlug: "kuchaman-city", orderType: "PICKUP", deliveryDate: tomorrow, deliverySlot: slot,
    extras: [{ name: shelf.name, quantity: 1 }],
    items: [{ productId: product.id, name: product.name, variantName: v.name, quantity: 2, unitPrice: v.price }],
  });
  const row = res.body?.order?.id ? await db.order.findUnique({ where: { id: res.body.order.id }, include: { items: true } }) : null;
  const expected = v.price * 2 + shelf.price;
  check(res.status === 200, "order placed", `${res.status} ${res.body?.message ?? ""}`);
  check(row?.itemTotal === expected, "add-on charged once, not per cake", `itemTotal ${row?.itemTotal} expected ${expected} (cake ${v.price}x2 + addon ${shelf.price})`);

  // grandTotal = itemTotal + packaging + gst (pickup, no delivery)
  const gstRate = store.gstRate ?? 0;
  const taxable = row.itemTotal + row.packagingCharge + row.deliveryCharge - row.discount;
  const expTax = Math.round(taxable * (gstRate / 100) * 100) / 100;
  const expGrand = Math.round((taxable + expTax) * 100) / 100;
  check(Math.abs(row.grandTotal - expGrand) < 0.001, "grand total adds up and is rounded", `grand ${row.grandTotal} expected ${expGrand}`);

  // extras over the per-order cap are refused
  const over = await post("/api/orders/create", {
    storeSlug: "kuchaman-city", orderType: "PICKUP", deliveryDate: tomorrow, deliverySlot: slot,
    extras: [{ name: shelf.name, quantity: 999 }],
    items: [{ productId: product.id, name: product.name, variantName: v.name, quantity: 1, unitPrice: v.price }],
  });
  check(over.status === 400, "too many of one add-on is refused", `${over.status}`);

  // unknown extra refused
  const bogus = await post("/api/orders/create", {
    storeSlug: "kuchaman-city", orderType: "PICKUP", deliveryDate: tomorrow, deliverySlot: slot,
    extras: [{ name: "Nonexistent Addon XYZ", quantity: 1 }],
    items: [{ productId: product.id, name: product.name, variantName: v.name, quantity: 1, unitPrice: v.price }],
  });
  check(bogus.status === 400, "unknown add-on is refused", `${bogus.status}`);

  if (row) await db.order.delete({ where: { id: row.id } }).catch(() => {});
  console.log(`  ${out.filter(Boolean).length}/${out.length} passed`);
  await browser.close();
  await db.$disconnect();
  process.exit(out.every(Boolean) ? 0 : 1);
})();
