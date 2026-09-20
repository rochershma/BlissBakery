// Multi-store separation suite.
// Creates a second store with its own menu, promo and order, then proves the
// admin is scoped to whichever store is selected and that the storefront store
// picker works on phone and desktop. Removes everything it creates.
const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");
const { adminContext } = require("./_session.cjs");
const db = new PrismaClient();

const BASE = process.env.BASE || "http://localhost:3005";
const TAG = `ms${Date.now().toString().slice(-6)}`;

const results = [];
const check = (ok, n, d = "") => {
  results.push({ ok, n, d });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${d ? " - " + d : ""}`);
};

(async () => {
  const made = { storeId: null, categoryId: null, productId: null, promoIds: [], orderIds: [] };
  const browser = await chromium.launch({ ignoreHTTPSErrors: true });
  const { ctx, page } = await adminContext(browser, BASE);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 110)));
  page.on("console", (m) => {
    // The promo test deliberately asks for a 400, which surfaces as a resource error.
    if (m.type() === "error" && !/favicon|Failed to load resource/i.test(m.text())) errors.push(m.text().slice(0, 110));
  });

  const go = (u) => page.goto(BASE + u, { waitUntil: "networkidle", timeout: 60000 });
  const api = (path, opts) => page.evaluate(async ([p, o]) => {
    const r = await fetch(p, o || undefined);
    let body = null; try { body = await r.json(); } catch {}
    return { status: r.status, body };
  }, [path, opts]);
  const pickStore = async (name) => {
    await go("/admin");
    await page.locator('button[aria-label="Switch store"]').first().click();
    await page.locator(`form button:has-text("${name}")`).first().click();
    await page.waitForTimeout(1500);
  };

  try {
    const home = await db.store.findFirst({ orderBy: { createdAt: "asc" } });
    check(!!home, "base store exists", home?.name);

    /* ---------- a second store with its own menu ---------- */
    console.log("\n[1] Second store");
    const second = await db.store.create({
      data: {
        name: `${TAG} Jaipur`, slug: `${TAG}-jaipur`, city: "Jaipur", state: "Rajasthan",
        address: "MI Road", pincode: "302001", phone: "9000000000", isOpen: true,
        packagingCharge: 25, deliveryCharge: 60, gstRate: 0,
      },
    });
    made.storeId = second.id;

    const cat = await db.category.create({
      data: { name: `${TAG} Jaipur Cakes`, slug: `${TAG}-jaipur-cakes`, storeId: second.id, isVisible: true },
    });
    made.categoryId = cat.id;

    // Same product name in both stores, deliberately different price.
    const product = await db.product.create({
      data: {
        name: `${TAG} Signature`, slug: `${TAG}-signature-jaipur`, categoryId: cat.id,
        basePrice: 2222, isAvailable: true, pricingStrategy: "FIXED",
        variants: { create: [{ name: "1 Kg", price: 2222 }] },
      },
    });
    made.productId = product.id;
    check(!!product.id, "second store has its own menu item", `${product.slug} @ ${product.basePrice}`);

    /* ---------- storefront is per store ---------- */
    console.log("\n[2] Storefront separation");
    const stores = await api("/api/stores");
    check(stores.body?.stores?.some((s) => s.id === second.id), "second store is offered to customers");

    let r = await go(`/store/${second.slug}/menu`);
    const jaipurCards = await page.$$eval(".card__n, .card h3, .v5grid a", (n) => n.map((x) => x.textContent.trim()));
    check(r.status() === 200 && jaipurCards.some((t) => t.includes(TAG)), "second store menu shows its own products", `${jaipurCards.length} cards`);
    check(jaipurCards.length <= 3, "second store menu shows only its own products", `${jaipurCards.length} cards for 1 product`);

    await go(`/store/${home.slug}/menu`);
    const homeMenu = await page.evaluate(() => document.body.innerText);
    check(!homeMenu.includes(TAG), "first store menu does not leak the other store's products");

    const brand = await page.evaluate(() => document.querySelector(".v5brand__s")?.textContent || "");
    check(brand.trim() === home.city, "header shows the store you are browsing", brand.trim());

    /* ---------- per-store promos ---------- */
    console.log("\n[3] Promo scoping");
    const now = new Date();
    const later = new Date(Date.now() + 7 * 864e5);
    const jaipurOnly = await db.promoCode.create({
      data: { code: `${TAG}JAI`.toUpperCase(), discountType: "FLAT", discountValue: 50, validFrom: now, validTo: later, isActive: true, storeId: second.id, occasionTag: "Test" },
    });
    const chainWide = await db.promoCode.create({
      data: { code: `${TAG}ALL`.toUpperCase(), discountType: "FLAT", discountValue: 25, validFrom: now, validTo: later, isActive: true, storeId: null, occasionTag: "Test" },
    });
    made.promoIds.push(jaipurOnly.id, chainWide.id);

    const atJaipur = await api(`/api/promo/list?store=${second.slug}`);
    const atHome = await api(`/api/promo/list?store=${home.slug}`);
    const codes = (res) => (res.body?.promos ?? []).map((p) => p.code);
    check(codes(atJaipur).includes(jaipurOnly.code), "store promo is offered at its own store");
    check(!codes(atHome).includes(jaipurOnly.code), "store promo is hidden at other stores");
    check(codes(atHome).includes(chainWide.code) && codes(atJaipur).includes(chainWide.code), "chain-wide promo shows at every store");

    const wrongStore = await api("/api/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: jaipurOnly.code, subtotal: 5000, storeSlug: home.slug }),
    });
    check(wrongStore.status === 400, "a store promo cannot be redeemed elsewhere", `HTTP ${wrongStore.status}`);

    const rightStore = await api("/api/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: jaipurOnly.code, subtotal: 5000, storeSlug: second.slug }),
    });
    check(rightStore.body?.success === true, "a store promo works at its own store");

    /* ---------- admin is scoped to the selected store ---------- */
    console.log("\n[4] Admin scoping");
    const anyUser = await db.user.findFirst({ where: { role: "CUSTOMER" } });
    const jaipurOrder = await db.order.create({
      data: {
        orderNumber: `${TAG}-J1`, userId: anyUser.id, storeId: second.id,
        orderType: "PICKUP", itemTotal: 2222, tax: 0, grandTotal: 2222, status: "PENDING",
      },
    });
    made.orderIds.push(jaipurOrder.id);

    await pickStore(second.name);
    const switched = await page.evaluate(() => document.querySelector('button[aria-label="Switch store"]')?.textContent || "");
    check(switched.includes(TAG), "store switcher shows the selected store", switched.trim());

    await go("/admin/menu");
    const menuTxt = await page.evaluate(() => document.body.innerText);
    check(menuTxt.includes(`${TAG} Jaipur Cakes`.slice(0, 14)), "admin menu shows the selected store's categories");

    await go("/admin/orders");
    const ordersTxt = await page.evaluate(() => document.body.innerText);
    // the list renders the last four characters of the order number
    check(ordersTxt.includes(jaipurOrder.orderNumber.slice(-4)), "admin orders show the selected store's orders", jaipurOrder.orderNumber.slice(-4));

    await go("/admin/promos");
    const promoTxt = await page.evaluate(() => document.body.innerText);
    check(promoTxt.includes(jaipurOnly.code), "admin promos include this store's codes");
    check(promoTxt.includes(chainWide.code), "admin promos include chain-wide codes");

    await go("/admin/settings");
    const pack = await page.inputValue('input[name="packagingCharge"]');
    check(Number(pack) === 25, "settings edit the selected store", `packaging ${pack}`);

    // now switch back and prove nothing from the other store is visible
    await pickStore(home.name);
    await go("/admin/menu");
    const homeMenuAdmin = await page.evaluate(() => document.body.innerText);
    check(!homeMenuAdmin.includes(`${TAG} Jaipur Cakes`.slice(0, 14)), "switching back hides the other store's menu");

    await go("/admin/orders");
    const homeOrders = await page.evaluate(() => document.body.innerText);
    check(!homeOrders.includes(jaipurOrder.orderNumber.slice(-4)), "switching back hides the other store's orders");

    await go("/admin/promos");
    const homePromos = await page.evaluate(() => document.body.innerText);
    check(!homePromos.includes(jaipurOnly.code), "switching back hides the other store's promos");

    await go("/admin/settings");
    const homePack = await page.inputValue('input[name="packagingCharge"]');
    check(Number(homePack) !== 25, "settings follow the switch back", `packaging ${homePack}`);

    /* ---------- picker on phone and desktop ---------- */
    console.log("\n[5] Storefront picker");
    for (const [label, size] of [["desktop", { width: 1440, height: 950 }], ["mobile", { width: 390, height: 844 }]]) {
      const p = await ctx.newPage();
      await p.setViewportSize(size);
      await p.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });

      const trigger = p.locator(".v5loc");
      check(await trigger.isVisible(), `${label}: store picker is visible`);

      await trigger.click();
      await p.waitForTimeout(900);
      const names = await p.$$eval(".v5store__i b", (n) => n.map((x) => x.textContent.trim()));
      check(names.length >= 2, `${label}: picker lists every open store`, names.join(" | "));

      const fits = await p.evaluate(() => {
        const el = document.querySelector(".v5store__pop");
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return r.left >= -1 && r.right <= window.innerWidth + 1 && r.bottom <= window.innerHeight + 1;
      });
      check(fits === true, `${label}: picker stays inside the viewport`);

      await p.locator(`.v5store__i:has-text("${TAG}")`).first().click();
      await p.waitForTimeout(1800);
      check(p.url().includes(second.slug), `${label}: choosing a store opens that store`, p.url().replace(BASE, ""));

      const nowBrand = await p.evaluate(() => document.querySelector(".v5brand__s")?.textContent || "");
      check(nowBrand.trim() === "Jaipur", `${label}: header updates to the chosen store`, nowBrand.trim());
      await p.close();
    }

    console.log("\n[6] Console");
    check(errors.length === 0, "zero console errors", errors.slice(0, 2).join(" ; "));
  } finally {
    for (const id of made.orderIds) await db.order.delete({ where: { id } }).catch(() => {});
    for (const id of made.promoIds) await db.promoCode.delete({ where: { id } }).catch(() => {});
    if (made.productId) await db.product.delete({ where: { id: made.productId } }).catch(() => {});
    if (made.categoryId) await db.category.delete({ where: { id: made.categoryId } }).catch(() => {});
    if (made.storeId) {
      await db.order.deleteMany({ where: { storeId: made.storeId } });
      await db.store.delete({ where: { id: made.storeId } }).catch(() => {});
    }
    await browser.close();
    await db.$disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n  ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("  FAILURES:");
    failed.forEach((f) => console.log(`   - ${f.n} ${f.d}`));
    process.exit(1);
  }
})();
