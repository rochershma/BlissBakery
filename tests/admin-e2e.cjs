// Admin CRUD + propagation suite.
// Drives the real admin UI, then checks how fast and how faithfully each
// change reaches the customer-facing pages. Cleans up after itself.
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:3005";
const PHONE = "9602831559";
const OTP = "999999";
const STAMP = Date.now().toString().slice(-6);

const results = [];
const pass = (n, d = "") => { results.push({ ok: true, n, d }); console.log(`  PASS  ${n}${d ? " - " + d : ""}`); };
const fail = (n, d = "") => { results.push({ ok: false, n, d }); console.log(`  FAIL  ${n}${d ? " - " + d : ""}`); };
const check = (c, n, d = "") => (c ? pass(n, d) : fail(n, d));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 120)));

  // Next returns 200 for *streamed* notFound() responses and 404 otherwise, so
  // assert the not-found UI plus the robots noindex tag rather than the status.
  const isGone = async (url) => {
    const res = await fetch(BASE + url, { redirect: "manual" });
    const body = await res.text();
    return {
      ok: res.status === 404 || (/not-found|Page not found/i.test(body) && /<meta name="robots"[^>]*noindex/i.test(body)),
      detail: `status ${res.status}`,
    };
  };

  const go = (u) => page.goto(BASE + u, { waitUntil: "networkidle", timeout: 60000 });

  /* ---------- 1. ADMIN ACCESS ---------- */
  console.log("\n[1] Admin access");
  await go("/");
  await page.getByRole("button", { name: /sign in/i }).first().click();
  await page.waitForTimeout(900);
  await page.locator('input[type="tel"]').first().fill(PHONE);
  await page.getByRole("button", { name: /send code/i }).first().click();
  await page.waitForTimeout(2200);
  const boxes = page.locator('input[maxlength="1"]');
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill(OTP[i]);
  await page.waitForTimeout(400);
  const v = page.getByRole("button", { name: /verify/i }).first();
  if (await v.count()) await v.click();
  await page.waitForTimeout(2500);

  let r = await go("/admin");
  check(r.status() === 200, "admin dashboard loads for admin user");

  // a signed-out visitor must not reach admin
  const anon = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const anonPage = await anon.newPage();
  const ar = await anonPage.goto(BASE + "/admin", { waitUntil: "domcontentloaded", timeout: 30000 });
  const anonUrl = anonPage.url();
  check(ar.status() !== 200 || !/\/admin$/.test(anonUrl), "anonymous visitor is blocked from /admin", `${ar.status()} ${anonUrl.replace(BASE, "")}`);
  await anon.close();

  /* ---------- 2. ADMIN PAGES RENDER ---------- */
  console.log("\n[2] Admin pages render");
  for (const p of ["/admin/menu", "/admin/orders", "/admin/banners", "/admin/add-ons",
    "/admin/occasions", "/admin/themes", "/admin/promos", "/admin/flavours",
    "/admin/customers", "/admin/settings", "/admin/delivery-config", "/admin/assets"]) {
    const res = await go(p);
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth === 0).length);
    check(res.status() === 200 && broken === 0, `${p} renders`, res.status() !== 200 ? `status ${res.status()}` : "");
  }

  /* ---------- 3. EDIT AN EXISTING PRODUCT ---------- */
  console.log("\n[3] Open product editors");
  {
    const { PrismaClient } = require("@prisma/client");
    const probe = new PrismaClient();
    // both pricing strategies render different editors — check each
    const custom = await probe.product.findFirst({ where: { pricingStrategy: "CUSTOM" }, select: { id: true, name: true } });
    const fixed = await probe.product.findFirst({ where: { pricingStrategy: "FIXED" }, select: { id: true, name: true } });
    await probe.$disconnect();
    for (const [label, p] of [["CUSTOM-priced", custom], ["FIXED-priced", fixed]]) {
      if (!p) continue;
      const before = errors.length;
      const res = await go(`/admin/menu/products/${p.id}`);
      await page.waitForTimeout(1200);
      const newErrors = errors.slice(before);
      check(res.status() === 200 && newErrors.length === 0,
        `${label} product editor opens cleanly`, newErrors[0] || p.name);
    }
  }

  /* ---------- 4. CREATE A PRODUCT ---------- */
  console.log("\n[4] Create product");
  const NAME = `ZZ Test Cake ${STAMP}`;
  let slug = "";
  await go("/admin/menu/products/new");
  try {
    await page.fill('input[name="name"]', NAME);
    const desc = page.locator('textarea[name="description"]');
    if (await desc.count()) await desc.fill("Created by the admin CRUD suite.");
    const base = page.locator('input[name="basePrice"]');
    if (await base.count()) await base.fill("777");
    const cat = page.locator('select[name="categoryId"]');
    if (await cat.count()) {
      const opts = await cat.locator("option").all();
      for (const o of opts) { const val = await o.getAttribute("value"); if (val) { await cat.selectOption(val); break; } }
    }
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => /create|save|add product/i.test(x.textContent));
      b && b.click();
    });
    await page.waitForTimeout(4000);
    check(!/\/products\/new/.test(page.url()), "product create redirects", page.url().replace(BASE, ""));
  } catch (e) {
    fail("product create form", e.message.slice(0, 90));
  }

  // find it back through the admin list
  await go(`/admin/menu?search=${encodeURIComponent(NAME)}`);
  const found = await page.evaluate((n) => document.body.innerText.includes(n), NAME);
  check(found, "new product appears in admin list");

  /* ---------- 4. PROPAGATION TO STOREFRONT ---------- */
  console.log("\n[4] Propagation to storefront");
  const { PrismaClient } = require("@prisma/client");
  const db = new PrismaClient();
  const created = await db.product.findFirst({ where: { name: NAME }, include: { variants: true } });
  check(!!created, "product exists in the database", created?.slug);

  if (created) {
    slug = created.slug;
    const t0 = Date.now();
    const pr = await go(`/store/kuchaman-city/menu/${slug}`);
    const ms = Date.now() - t0;
    const shows = await page.evaluate((n) => document.body.innerText.includes(n), NAME);
    check(pr.status() === 200 && shows, "new product is live on the storefront immediately", `${ms}ms`);

    /* ---------- 5. EDIT PRICE ---------- */
    console.log("\n[5] Edit propagates");
    await db.product.update({ where: { id: created.id }, data: { basePrice: 1234 } });
    await go(`/store/kuchaman-city/menu/${slug}`);
    const priceShown = await page.evaluate(() => document.querySelector(".pdp5__price b")?.textContent || "");
    check(/1,?234/.test(priceShown), "price edit is visible without a rebuild", priceShown);

    /* ---------- 6. HIDE PRODUCT ---------- */
    console.log("\n[6] Availability");
    await db.product.update({ where: { id: created.id }, data: { isAvailable: false } });
    const hidden = await isGone(`/store/kuchaman-city/menu/${slug}`);
    check(hidden.ok, "unavailable product is no longer reachable", hidden.detail);

    const inList = await page.evaluate(async (s) => {
      const res = await fetch(`/api/products/list?limit=200`);
      const d = await res.json();
      return (d.items || []).some((x) => x.slug === s);
    }, slug);
    check(inList === false, "unavailable product is excluded from listings");

    /* ---------- 7. DELETE ---------- */
    console.log("\n[7] Delete");
    await db.productVariant.deleteMany({ where: { productId: created.id } });
    await db.product.delete({ where: { id: created.id } });
    const gone = await isGone(`/store/kuchaman-city/menu/${slug}`);
    check(gone.ok, "deleted product is no longer reachable", gone.detail);
    const stillInDb = await db.product.findFirst({ where: { name: NAME } });
    check(!stillInDb, "test product cleaned up");
  }

  await db.$disconnect();

  console.log("\n[8] JS errors");
  check(errors.length === 0, "zero admin page errors", errors[0] || "");

  const ok = results.filter((x) => x.ok).length;
  console.log("\n" + "=".repeat(60));
  console.log(`  ${ok}/${results.length} passed`);
  const bad = results.filter((x) => !x.ok);
  if (bad.length) {
    console.log("\n  FAILURES:");
    bad.forEach((b) => console.log(`   - ${b.n}${b.d ? " - " + b.d : ""}`));
  }
  console.log("=".repeat(60));
  await browser.close();
  process.exit(bad.length ? 1 : 0);
})();
