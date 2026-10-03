// Real customer journey on mobile: browse -> PDP -> add -> cart -> checkout -> place order -> order page.
// Captures full-page screenshots and step timings. BASE=... PLACE=1 node tests/journey.cjs
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { adminContext } = require("./_session.cjs");

const BASE = process.env.BASE || "http://localhost:3005";
const OUT = process.env.OUT || path.join(__dirname, "..", ".audit");
const W = Number(process.env.W || 390);
fs.mkdirSync(OUT, { recursive: true });
const p = W < 768 ? "j-m" : "j-d";

(async () => {
  const b = await chromium.launch();
  const mobile = W < 768;
  const { ctx, page } = await adminContext(b, BASE, {
    viewport: { width: W, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile,
  });
  const errs = [];
  page.on("pageerror", (e) => errs.push(`PAGEERR @${page.url().replace(BASE, "")} ${e.message.slice(0, 140)}`));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 140)); });
  const shot = async (n, full = true) => { await page.waitForTimeout(700); await page.screenshot({ path: path.join(OUT, `${p}-${n}.png`), fullPage: full }); };
  const t = async (label, fn) => { const t0 = Date.now(); await fn(); console.log(`${label.padEnd(28)} ${Date.now() - t0}ms`); };

  await page.evaluate(() => localStorage.removeItem("bliss-cart"));
  await t("menu load", () => page.goto(BASE + "/store/kuchaman-city/menu", { waitUntil: "networkidle" }));
  await shot("menu");
  await t("open product (click)", async () => {
    await page.locator('a[href*="/store/kuchaman-city/menu/"]').first().click();
    await page.waitForURL(/\/menu\/.+/, { timeout: 20000 });
    await page.waitForLoadState("networkidle");
  });
  await shot("pdp");
  const add = page.getByRole("button", { name: /add to (cart|basket)/i }).first();
  console.log("add-to-cart buttons:", await add.count());
  if (await add.count()) await t("add to cart", async () => { await add.click(); await page.waitForTimeout(600); });
  await shot("pdp-after-add", false);
  // dismiss upsell if present
  const skip = page.getByRole("button", { name: /skip|no thanks|continue|go to cart|view cart/i }).first();
  if (await skip.count()) { await skip.click().catch(() => {}); await page.waitForTimeout(600); }

  await t("cart load", () => page.goto(BASE + "/cart", { waitUntil: "networkidle" }));
  await shot("cart");
  await t("checkout load", () => page.goto(BASE + "/checkout", { waitUntil: "networkidle" }));
  await page.waitForTimeout(1500);
  await shot("checkout");
  const state = await page.evaluate(() => ({
    datePressed: [...document.querySelectorAll(".dpick__d")].filter((d) => d.getAttribute("aria-pressed") === "true").map((d) => d.textContent),
    slotPressed: [...document.querySelectorAll(".slots .chip")].filter((d) => d.getAttribute("aria-pressed") === "true").map((d) => d.textContent),
    addrOn: document.querySelectorAll(".addr5.is-on").length,
    cta: [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).filter((x) => /place|pay|order/i.test(x)),
  }));
  console.log("checkout state", JSON.stringify(state));

  if (process.env.PLACE) {
    await page.getByRole("button", { name: /pick up in store/i }).click();
    await page.waitForTimeout(300);
    const cta = page.getByRole("button", { name: /place|pay/i }).last();
    await t("place order", async () => { await cta.click(); await page.waitForURL(/\/order\//, { timeout: 30000 }); await page.waitForLoadState("networkidle"); });
    await shot("order");
  }
  console.log("errors:", errs);
  await b.close();
})();
