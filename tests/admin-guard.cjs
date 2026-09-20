// Admin input-hardening suite: proves the numbers an admin can type cannot
// corrupt order totals, and that writes still require an admin session.
const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");
const { adminContext } = require("./_session.cjs");
const db = new PrismaClient();

const BASE = process.env.BASE || "http://localhost:3005";
const TAG = `gd${Date.now().toString().slice(-6)}`;

const results = [];
const check = (ok, n, d = "") => {
  results.push({ ok, n, d });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${d ? " - " + d : ""}`);
};

(async () => {
  const browser = await chromium.launch({ ignoreHTTPSErrors: true });
  const { ctx, page } = await adminContext(browser, BASE);
  const made = { promoIds: [], addOnIds: [] };

  const go = (u) => page.goto(BASE + u, { waitUntil: "networkidle", timeout: 60000 });
  const api = (path, opts) => page.evaluate(async ([p, o]) => {
    const r = await fetch(p, o || undefined);
    let body = null; try { body = await r.json(); } catch {}
    return { status: r.status, body };
  }, [path, opts]);

  const submitPromo = async (fields) => {
    await go("/admin/promos/new");
    await page.fill('input[name="code"]', fields.code);
    await page.selectOption('select[name="discountType"]', fields.type);
    await page.fill('input[name="discountValue"]', String(fields.value));
    await page.fill('input[name="validFrom"]', fields.from);
    await page.fill('input[name="validTo"]', fields.to);
    await page.getByRole("button", { name: /create|save/i }).first().click();
    await page.waitForTimeout(1600);
    return page.url();
  };

  try {
    const today = new Date().toISOString().slice(0, 10);
    const later = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    const earlier = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

    /* ---------- promo numbers ---------- */
    console.log("\n[1] Promo validation");

    let url = await submitPromo({ code: `${TAG}NEG`, type: "PERCENTAGE", value: -20, from: today, to: later });
    check(/error=/.test(url), "a negative discount is refused", decodeURIComponent(url.split("error=")[1] ?? ""));
    check(!(await db.promoCode.findUnique({ where: { code: `${TAG}NEG` } })), "nothing was written for it");

    url = await submitPromo({ code: `${TAG}BIG`, type: "PERCENTAGE", value: 150, from: today, to: later });
    check(/error=/.test(url), "a discount over 100% is refused");

    url = await submitPromo({ code: `${TAG}DATE`, type: "FLAT", value: 50, from: later, to: earlier });
    check(/error=/.test(url), "an end date before the start date is refused");

    url = await submitPromo({ code: `${TAG}OK`, type: "FLAT", value: 50, from: today, to: later });
    const good = await db.promoCode.findUnique({ where: { code: `${TAG}OK` } });
    check(!!good, "a sensible promo still saves", good?.code);
    if (good) made.promoIds.push(good.id);

    if (good) {
      url = await submitPromo({ code: `${TAG}OK`, type: "FLAT", value: 60, from: today, to: later });
      const count = await db.promoCode.count({ where: { code: `${TAG}OK` } });
      check(/error=/.test(url) && count === 1, "a duplicate code is refused, not crashed into a 500", `${count} row(s)`);
    }

    /* ---------- add-on price ---------- */
    console.log("\n[2] Add-on price");
    const negative = await api("/api/admin/addons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${TAG} Bad`, price: -99, category: "CANDLES" }),
    });
    check(negative.status === 400, "a negative add-on price is refused", `HTTP ${negative.status}`);

    const fine = await api("/api/admin/addons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${TAG} Good`, price: 49, category: "CANDLES" }),
    });
    check(fine.status < 400, "a valid add-on still saves", `HTTP ${fine.status}`);
    const addOn = await db.storeAddOn.findFirst({ where: { name: `${TAG} Good` } });
    if (addOn) made.addOnIds.push(addOn.id);

    if (addOn) {
      const patched = await api("/api/admin/addons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: addOn.id, price: -5 }),
      });
      check(patched.status === 400, "an add-on cannot be edited to a negative price", `HTTP ${patched.status}`);
    }

    /* ---------- delivery config bounds ---------- */
    console.log("\n[3] Delivery config");
    const before = await db.store.findFirst({ select: { id: true, gstRate: true, deliveryTiers: true } });
    const bad = await api("/api/admin/delivery-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gstRate: 999, deliveryTiers: [{ maxKm: -5, fee: -100 }] }),
    });
    check(bad.status < 400, "the config endpoint accepts the request", `HTTP ${bad.status}`);

    const after = await db.store.findFirst({ where: { id: before.id }, select: { gstRate: true, deliveryTiers: true } });
    check(after.gstRate <= 28, "an absurd GST rate is clamped, not stored", `${after.gstRate}%`);
    const tiers = JSON.parse(after.deliveryTiers ?? "[]");
    check(tiers.every((t) => t.maxKm >= 0 && t.fee >= 0), "negative delivery tiers are clamped", JSON.stringify(tiers));
    await db.store.update({ where: { id: before.id }, data: before });

    /* ---------- authorisation ---------- */
    console.log("\n[4] Authorisation");
    const anon = await browser.newContext({ ignoreHTTPSErrors: true });
    const anonPage = await anon.newPage();
    await anonPage.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
    for (const [label, path, opts] of [
      ["delivery config", "/api/admin/delivery-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" }],
      ["flavours", "/api/admin/flavours", { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" }],
      ["add-ons", "/api/admin/addons", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"name":"x","price":1}' }],
    ]) {
      const res = await anonPage.evaluate(async ([p, o]) => {
        const r = await fetch(p, o);
        return r.status;
      }, [path, opts]);
      check(res === 401 || res === 403, `${label} rejects a signed-out caller`, `HTTP ${res}`);
    }
    await anon.close();

    console.log("\n[5] Console");
    check(true, "suite completed");
    await ctx.close();
  } finally {
    for (const id of made.promoIds) await db.promoCode.delete({ where: { id } }).catch(() => {});
    for (const id of made.addOnIds) await db.storeAddOn.delete({ where: { id } }).catch(() => {});
    await db.promoCode.deleteMany({ where: { code: { startsWith: TAG } } });
    await db.storeAddOn.deleteMany({ where: { name: { startsWith: TAG } } });
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
