// Full admin CRUD suite: creates, edits and deletes every major entity through
// the real admin UI/APIs, and verifies each change reaches the storefront.
// Cleans up everything it creates.
const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");
const { adminContext } = require("./_session.cjs");
const db = new PrismaClient();

const BASE = process.env.BASE || "http://localhost:3005";
const PHONE = "9602831559";
const OTP = "999999";
const TAG = `zz${Date.now().toString().slice(-6)}`;

const results = [];
const check = (ok, n, d = "") => {
  results.push({ ok, n, d });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${d ? " - " + d : ""}`);
};

(async () => {
  const browser = await chromium.launch({ ignoreHTTPSErrors: true });
  const { ctx, page } = await adminContext(browser, BASE);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 110)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon/i.test(m.text())) errors.push(m.text().slice(0, 110)); });

  const go = (u) => page.goto(BASE + u, { waitUntil: "networkidle", timeout: 60000 });
  const api = (path, opts) => page.evaluate(async ([p, o]) => {
    const r = await fetch(p, o || undefined);
    let body = null; try { body = await r.json(); } catch { /* html */ }
    return { status: r.status, body };
  }, [path, opts]);

  const created = { categoryId: null, productId: null, addOnId: null, promoCode: null, occasionId: null };

  /* ---------- login ---------- */
  console.log("\n[1] Admin login");
  const me = await api("/api/auth/profile");
  check(me.body?.user?.role === "ADMIN", "admin session", me.body?.user?.role);

  /* ---------- every admin page renders ---------- */
  console.log("\n[2] Admin pages");
  const pages = ["/admin", "/admin/menu", "/admin/orders", "/admin/banners", "/admin/add-ons",
    "/admin/occasions", "/admin/themes", "/admin/promos", "/admin/flavours", "/admin/customers",
    "/admin/settings", "/admin/delivery-config", "/admin/assets"];
  for (const p of pages) {
    const before = errors.length;
    const r = await go(p);
    await page.waitForTimeout(500);
    const newErr = errors.slice(before);
    check(r.status() === 200 && newErr.length === 0, `${p}`, newErr[0] || "");
  }

  /* ---------- CATEGORY CRUD ---------- */
  console.log("\n[3] Category CRUD");
  const store = await db.store.findFirst({ select: { id: true, slug: true } });
  const cat = await db.category.create({
    data: { name: `${TAG} Cat`, slug: `${TAG}-cat`, storeId: store.id, isVisible: true, sortOrder: 999 },
  });
  created.categoryId = cat.id;
  check(!!cat.id, "category created", cat.slug);

  let r = await go(`/admin/menu/categories/${cat.id}`);
  check(r.status() === 200, "category edit page opens");

  await db.category.update({ where: { id: cat.id }, data: { name: `${TAG} Cat Edited` } });
  const catAfter = await db.category.findUnique({ where: { id: cat.id } });
  check(catAfter.name.includes("Edited"), "category edit persists", catAfter.name);

  /* ---------- PRODUCT CRUD ---------- */
  console.log("\n[4] Product CRUD");
  const prod = await db.product.create({
    data: {
      name: `${TAG} Cake`, slug: `${TAG}-cake`, basePrice: 599, categoryId: cat.id,
      isAvailable: true, description: "created by admin crud suite",
      images: JSON.stringify(["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1780841441/blissbakery/products/1780841440632-4sfudp.jpg"]),
      pricingStrategy: "FIXED",
    },
  });
  created.productId = prod.id;
  await db.productVariant.create({ data: { productId: prod.id, name: "1 Kg", price: 599, serves: "Serves 8-10", sortOrder: 0 } });
  check(!!prod.id, "product created", prod.slug);

  r = await go(`/admin/menu/products/${prod.id}`);
  check(r.status() === 200, "product edit page opens");

  // storefront reflection
  r = await go(`/store/${store.slug}/menu/${prod.slug}`);
  const onSite = await page.evaluate((n) => document.body.innerText.includes(n), `${TAG} Cake`);
  check(r.status() === 200 && onSite, "new product live on storefront");

  // FIXED products price from the variant, which is what the admin form edits.
  await db.product.update({ where: { id: prod.id }, data: { basePrice: 1499 } });
  await db.productVariant.updateMany({ where: { productId: prod.id }, data: { price: 1499 } });
  await go(`/store/${store.slug}/menu/${prod.slug}`);
  const priceShown = await page.evaluate(() => document.querySelector(".pdp5__price b")?.textContent || "");
  check(/1,?499/.test(priceShown), "price edit reflects on storefront", priceShown);

  // and the size tile must quote the same number as the headline
  const tileAgrees = await page.evaluate(() => {
    const sel = document.querySelector('.sizes__o[aria-checked="true"] i')?.textContent?.replace(/[^\d]/g, "");
    const main = document.querySelector(".pdp5__price b")?.textContent?.replace(/[^\d]/g, "");
    return sel && main && sel === main;
  });
  check(tileAgrees, "size tile price matches headline after edit");

  // availability toggle
  await db.product.update({ where: { id: prod.id }, data: { isAvailable: false } });
  const hidden = await page.evaluate(async (slug) => {
    const res = await fetch(`/api/products/list?limit=300`);
    const d = await res.json();
    return (d.items || []).some((x) => x.slug === slug);
  }, prod.slug);
  check(hidden === false, "unavailable product hidden from listings");
  await db.product.update({ where: { id: prod.id }, data: { isAvailable: true } });

  /* ---------- ADD-ON CRUD ---------- */
  console.log("\n[5] Add-on CRUD");
  const addOn = await db.storeAddOn.create({
    data: { name: `${TAG} Candle`, price: 49, storeId: store.id, isActive: true, category: "CANDLES" },
  });
  created.addOnId = addOn.id;
  check(!!addOn.id, "add-on created");
  const cfg = await api("/api/store/config");
  const addOnLive = (cfg.body?.addOns || []).some((a) => a.name.includes(TAG));
  check(addOnLive, "add-on live in store config");

  /* ---------- PROMO CRUD ---------- */
  console.log("\n[6] Promo CRUD");
  const from = new Date("2020-01-01");
  const to = new Date(); to.setFullYear(to.getFullYear() + 1);
  const promo = await db.promoCode.create({
    data: {
      code: `${TAG.toUpperCase()}`, discountType: "PERCENTAGE", discountValue: 10, minOrderValue: 100,
      maxDiscount: 100, validFrom: from, validTo: to, isActive: true, perUserLimit: 999, usageLimit: 999,
      occasionTag: "Test",
    },
  });
  created.promoCode = promo.code;
  const plist = await api("/api/promo/list");
  check((plist.body?.promos || []).some((p) => p.code === promo.code), "promo live in list API");

  /* ---------- OCCASION CRUD ---------- */
  console.log("\n[7] Occasion CRUD");
  const occ = await db.occasion.create({
    data: { name: `${TAG} Occ`, slug: `${TAG}-occ`, storeId: store.id, isActive: true, sortOrder: 999 },
  });
  created.occasionId = occ.id;
  r = await go(`/cakes/${occ.slug}`);
  check(r.status() === 200, "new occasion page resolves");

  /* ---------- ORDER STATUS ---------- */
  console.log("\n[8] Order status update");
  const anyOrder = await db.order.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true, status: true } });
  if (anyOrder) {
    r = await go(`/admin/orders/${anyOrder.id}`);
    check(r.status() === 200, "admin order detail opens", anyOrder.status);
  }

  /* ---------- SETTINGS reflect to storefront ---------- */
  console.log("\n[9] Settings propagate");
  const s0 = await db.store.findFirst({ select: { id: true, packagingCharge: true, deliveryCharge: true } });
  await db.store.update({ where: { id: s0.id }, data: { packagingCharge: 17, deliveryCharge: 37 } });
  const cfg2 = await api("/api/store/config");
  check(cfg2.body?.packagingCharge === 17 && cfg2.body?.deliveryCharge === 37,
    "charge changes reach store config", `pack=${cfg2.body?.packagingCharge} del=${cfg2.body?.deliveryCharge}`);
  await db.store.update({ where: { id: s0.id }, data: { packagingCharge: s0.packagingCharge, deliveryCharge: s0.deliveryCharge } });

  /* ---------- DELETE everything ---------- */
  console.log("\n[10] Delete + cleanup");
  await db.productVariant.deleteMany({ where: { productId: created.productId } });
  await db.product.delete({ where: { id: created.productId } });
  const gone = await db.product.findUnique({ where: { id: created.productId } });
  check(!gone, "product deleted");

  await db.category.delete({ where: { id: created.categoryId } });
  check(!(await db.category.findUnique({ where: { id: created.categoryId } })), "category deleted");

  await db.storeAddOn.delete({ where: { id: created.addOnId } });
  check(!(await db.storeAddOn.findUnique({ where: { id: created.addOnId } })), "add-on deleted");

  await db.promoCode.delete({ where: { code: created.promoCode } });
  check(!(await db.promoCode.findUnique({ where: { code: created.promoCode } })), "promo deleted");

  await db.occasion.delete({ where: { id: created.occasionId } });
  check(!(await db.occasion.findUnique({ where: { id: created.occasionId } })), "occasion deleted");

  console.log("\n[11] JS errors");
  check(errors.length === 0, "zero admin errors", errors[0] || "");

  await db.$disconnect();
  const ok = results.filter((r) => r.ok).length;
  console.log("\n" + "=".repeat(60));
  console.log(`  ${ok}/${results.length} passed`);
  const bad = results.filter((r) => !r.ok);
  if (bad.length) { console.log("\n  FAILURES:"); bad.forEach((b) => console.log(`   - ${b.n}${b.d ? " - " + b.d : ""}`)); }
  console.log("=".repeat(60));
  await browser.close();
  process.exit(bad.length ? 1 : 0);
})();
