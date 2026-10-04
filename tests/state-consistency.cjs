// State-consistency suite — proves that mutations in one flow stay consistent
// with the surfaces that read them, exercising the exact broken sequences the
// audit found: cached cart prices drifting from live prices, add-ons deleted
// mid-session, and admin optimistic updates surviving a failed request.
//
// Create -> Verify -> Update -> Verify -> Delete -> Verify removal everywhere.
const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");
const { adminContext } = require("./_session.cjs");
const db = new PrismaClient();

const BASE = process.env.BASE || "http://localhost:3005";
const TAG = `sc${Date.now().toString().slice(-6)}`;

const results = [];
const check = (ok, n, d = "") => {
  results.push({ ok, n, d });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${d ? " - " + d : ""}`);
};
const digits = (s) => Number(String(s || "").replace(/[^\d]/g, ""));

(async () => {
  const browser = await chromium.launch({ ignoreHTTPSErrors: true });
  const { ctx, page } = await adminContext(browser, BASE);

  const store = await db.store.findFirst({ where: { slug: "kuchaman-city" }, select: { id: true, slug: true } });

  const api = (path, opts) => page.evaluate(async ([p, o]) => {
    const r = await fetch(p, o || undefined);
    let body = null; try { body = await r.json(); } catch { /* html */ }
    return { status: r.status, body };
  }, [path, opts]);

  // Seeds the Zustand cart (localStorage) then opens a cart/checkout screen.
  const seedCart = async (items, extras = {}) => {
    await page.evaluate(({ items, extras }) => {
      localStorage.setItem("bliss-bakery-cart", JSON.stringify({
        state: { items, extras, storeSlug: "kuchaman-city", orderType: "DELIVERY", specialInstructions: "" },
        version: 0,
      }));
    }, { items, extras });
  };

  // Make sure localStorage is reachable (same origin) before seeding.
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });

  const created = { categoryId: null, productId: null, variantId: null, addOnId: null, orderId: null };

  try {
    /* ---------------------------------------------------------------- */
    console.log("\n[1] Cart price drift reconciles to live price");

    const cat = await db.category.create({
      data: { name: `${TAG} Cat`, slug: `${TAG}-cat`, storeId: store.id, isVisible: true, sortOrder: 999 },
    });
    created.categoryId = cat.id;
    const prod = await db.product.create({
      data: {
        name: `${TAG} Cake`, slug: `${TAG}-cake`, basePrice: 500, categoryId: cat.id,
        isAvailable: true, description: "state-consistency suite", pricingStrategy: "FIXED",
        images: JSON.stringify(["https://res.cloudinary.com/dvw9o0f8z/image/upload/v1780841441/blissbakery/products/1780841440632-4sfudp.jpg"]),
      },
    });
    created.productId = prod.id;
    const variant = await db.productVariant.create({
      data: { productId: prod.id, name: "1 Kg", price: 500, serves: "Serves 8-10", sortOrder: 0 },
    });
    created.variantId = variant.id;

    // Seed the cart at a STALE price (400) — the live price is 500.
    await seedCart([{ productId: prod.id, productSlug: prod.slug, name: `${TAG} Cake`, variantName: "1 Kg", unitPrice: 400, quantity: 1 }]);
    await page.goto(BASE + "/cart", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1800);
    const line1 = await page.evaluate(() => document.querySelector(".crow__price")?.textContent || "");
    check(digits(line1) === 500, "stale cart price corrected to live price on load", `showed ${digits(line1)} expected 500`);

    // Update the live price, reload, and confirm the cart follows.
    await db.productVariant.update({ where: { id: variant.id }, data: { price: 650 } });
    await page.goto(BASE + "/cart", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1800);
    const line2 = await page.evaluate(() => document.querySelector(".crow__price")?.textContent || "");
    check(digits(line2) === 650, "cart reflects a second price change", `showed ${digits(line2)} expected 650`);

    // Make it unavailable — the line must disappear from the cart entirely.
    await db.product.update({ where: { id: prod.id }, data: { isAvailable: false } });
    await page.goto(BASE + "/cart", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1800);
    const rows = await page.evaluate(() => document.querySelectorAll(".crow").length);
    check(rows === 0, "unavailable item is removed from the cart", `${rows} rows left`);
    await db.product.update({ where: { id: prod.id }, data: { isAvailable: true } });

    /* ---------------------------------------------------------------- */
    console.log("\n[2] Deleted add-on is dropped from checkout, not silently billed");

    const maxOrder = await db.storeAddOn.aggregate({ where: { storeId: store.id }, _max: { sortOrder: true } });
    const addon = await db.storeAddOn.create({
      data: { name: `${TAG} Candle`, price: 60, category: "DECORATION", storeId: store.id, isActive: true, sortOrder: (maxOrder._max.sortOrder || 0) + 1 },
    });
    created.addOnId = addon.id;

    // Cart with the product (live price 650) + the shelf add-on selected.
    await seedCart(
      [{ productId: prod.id, productSlug: prod.slug, name: `${TAG} Cake`, variantName: "1 Kg", unitPrice: 650, quantity: 1 }],
      { [addon.id]: 1 },
    );
    await page.goto(BASE + "/checkout", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1800);
    const addonLineBefore = await page.evaluate(() =>
      [...document.querySelectorAll(".sline")].some((l) => /Add-ons/i.test(l.textContent || "")));
    check(addonLineBefore, "selected add-on shows in the checkout bill");

    // Admin deletes the add-on; returning to checkout must drop it cleanly.
    await db.storeAddOn.delete({ where: { id: addon.id } });
    created.addOnId = null;
    await page.goto(BASE + "/checkout", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1800);
    const addonLineAfter = await page.evaluate(() =>
      [...document.querySelectorAll(".sline")].some((l) => /Add-ons/i.test(l.textContent || "")));
    const extrasCleared = await page.evaluate(() => {
      try { return Object.keys(JSON.parse(localStorage.getItem("bliss-bakery-cart")).state.extras || {}).length === 0; }
      catch { return false; }
    });
    check(!addonLineAfter, "deleted add-on no longer bills in checkout");
    check(extrasCleared, "deleted add-on is cleared from the cart store");

    /* ---------------------------------------------------------------- */
    console.log("\n[3] Admin add-on edit does not persist locally when the API fails");

    const maxOrder2 = await db.storeAddOn.aggregate({ where: { storeId: store.id }, _max: { sortOrder: true } });
    const addon2 = await db.storeAddOn.create({
      data: { name: `${TAG} Topper`, price: 40, category: "DECORATION", storeId: store.id, isActive: true, sortOrder: (maxOrder2._max.sortOrder || 0) + 1 },
    });
    created.addOnId = addon2.id;

    await page.goto(BASE + "/admin/add-ons", { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(800);

    // Force every write to the add-on API to fail.
    await page.route("**/api/admin/addons", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "forced failure" }) }));

    const toggle = page.locator("div.p-3").filter({ hasText: `${TAG} Topper` }).getByRole("button", { name: /Active|Off/ });
    const labelBefore = (await toggle.textContent().catch(() => "")) || "";
    await toggle.click().catch(() => {});
    await page.waitForTimeout(800);
    const labelAfter = (await toggle.textContent().catch(() => "")) || "";
    check(labelBefore.trim() === "Active" && labelAfter.trim() === "Active",
      "failed toggle does not flip the UI (no zombie state)", `${labelBefore.trim()} -> ${labelAfter.trim()}`);

    const dbAddon = await db.storeAddOn.findUnique({ where: { id: addon2.id } });
    check(dbAddon?.isActive === true, "server state unchanged after failed toggle", String(dbAddon?.isActive));

    await page.unroute("**/api/admin/addons");

    /* ---------------------------------------------------------------- */
    console.log("\n[4] Order status: optimistic lock + terminal guard");

    const adminUser = await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
    const order = await db.order.create({
      data: {
        orderNumber: `${TAG}-ord`, userId: adminUser.id, storeId: store.id,
        orderType: "PICKUP", status: "CONFIRMED", itemTotal: 100, tax: 0, grandTotal: 100,
      },
    });
    created.orderId = order.id;
    const put = (bodyObj) => api(`/api/admin/orders/${order.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyObj),
    });

    // A stale expectedStatus (someone else already moved it) must be refused.
    const stale = await put({ status: "PREPARING", expectedStatus: "PENDING" });
    check(stale.status === 409, "concurrent status update with stale expectation is rejected", `http ${stale.status}`);
    const afterStale = await db.order.findUnique({ where: { id: order.id }, select: { status: true } });
    check(afterStale.status === "CONFIRMED", "order status unchanged after a rejected update", afterStale.status);

    // The matching expectation goes through.
    const good = await put({ status: "PREPARING", expectedStatus: "CONFIRMED" });
    check(good.status === 200, "status update with the correct expectation is applied", `http ${good.status}`);

    // A finished (terminal) order can't be reopened or cancelled out from under itself.
    await db.order.update({ where: { id: order.id }, data: { status: "PICKED_UP" } });
    const reopen = await put({ status: "CONFIRMED", expectedStatus: "PICKED_UP" });
    check(reopen.status === 409, "a finished order cannot be reopened", `http ${reopen.status}`);
  } catch (e) {
    check(false, "suite ran without throwing", e.message.slice(0, 160));
  } finally {
    // Cleanup everything this run created.
    if (created.orderId) await db.orderStatusLog.deleteMany({ where: { orderId: created.orderId } }).catch(() => {});
    if (created.orderId) await db.order.delete({ where: { id: created.orderId } }).catch(() => {});
    if (created.addOnId) await db.storeAddOn.delete({ where: { id: created.addOnId } }).catch(() => {});
    if (created.variantId) await db.productVariant.deleteMany({ where: { productId: created.productId } }).catch(() => {});
    if (created.productId) await db.product.delete({ where: { id: created.productId } }).catch(() => {});
    if (created.categoryId) await db.category.delete({ where: { id: created.categoryId } }).catch(() => {});
    await db.storeAddOn.deleteMany({ where: { name: { startsWith: TAG } } }).catch(() => {});
  }

  await ctx.close();
  await browser.close();
  await db.$disconnect();

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${"=".repeat(60)}\n  ${passed}/${results.length} passed\n${"=".repeat(60)}`);
  process.exit(passed === results.length ? 0 : 1);
})();
