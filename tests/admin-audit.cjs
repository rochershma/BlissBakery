// Screenshots + error capture for every admin page. BASE=... node tests/admin-audit.cjs [width]
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { adminContext } = require("./_session.cjs");

const BASE = process.env.BASE || "http://localhost:3005";
const OUT = process.env.OUT || path.join(__dirname, "..", ".audit");
const W = Number(process.argv[2] || 1440);
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = ["/admin", "/admin/orders", "/admin/menu", "/admin/menu/products/new", "/admin/banners", "/admin/occasions",
  "/admin/themes", "/admin/add-ons", "/admin/flavours", "/admin/promos", "/admin/customers", "/admin/settings",
  "/admin/delivery-config", "/admin/stores", "/admin/assets"];

(async () => {
  const b = await chromium.launch();
  const mobile = W < 768;
  const { page } = await adminContext(b, BASE, { viewport: { width: W, height: 900 }, isMobile: mobile, hasTouch: mobile });
  const errs = [];
  page.on("pageerror", (e) => errs.push("PAGEERR " + e.message.slice(0, 140)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 140)); });
  for (const r of ROUTES) {
    errs.length = 0;
    const t0 = Date.now();
    const res = await page.goto(BASE + r, { waitUntil: "networkidle", timeout: 60000 }).catch((e) => null);
    const ms = Date.now() - t0;
    const ovf = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const name = r.replace(/\//g, "_").replace(/^_/, "") || "admin";
    await page.screenshot({ path: path.join(OUT, `a${mobile ? "m" : "d"}-${name}.png`), fullPage: !!process.env.FULL });
    console.log(`${r.padEnd(28)} ${res?.status()} ${ms}ms ovf=${ovf} errs=${JSON.stringify([...new Set(errs)])}`);
  }
  // first order detail
  await page.goto(BASE + "/admin/orders", { waitUntil: "networkidle" });
  const href = await page.evaluate(() => [...document.querySelectorAll('a[href^="/admin/orders/"]')].map((a) => a.getAttribute("href")).find((h) => !/export/.test(h)));
  if (href) {
    await page.goto(BASE + href, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT, `a${mobile ? "m" : "d"}-order-detail.png`), fullPage: true });
    console.log("order detail", href);
  }
  await b.close();
})();
