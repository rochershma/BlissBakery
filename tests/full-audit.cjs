// Page-by-page audit: status, console/page errors, failed requests, overflow,
// small tap targets, LCP/CLS, and a viewport screenshot per page.
// BASE=http://172.187.217.79 node tests/full-audit.cjs [mobile|desktop|both]
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE || "http://localhost:3005";
const OUT = process.env.OUT || path.join(__dirname, "..", ".audit");
const STORE = process.env.STORE || "kuchaman-city";
const MODE = process.argv[2] || "both";
fs.mkdirSync(OUT, { recursive: true });

const VPS = {
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  desktop: { viewport: { width: 1440, height: 900 } },
};

const STATIC_ROUTES = [
  ["home", "/"],
  ["menu", `/store/${STORE}/menu`],
  ["occasion", "/cakes/birthday"],
  ["search", "/search?q=chocolate"],
  ["custom", `/store/${STORE}/custom-cakes`],
  ["cart", "/cart"],
  ["checkout", "/checkout"],
  ["offers", "/offers"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["privacy", "/privacy"],
  ["terms", "/terms"],
  ["refund", "/refund-policy"],
  ["profile", "/profile"],
  ["orders", "/orders"],
  ["addresses", "/addresses"],
  ["track", "/track"],
  ["404", "/does-not-exist"],
];

async function audit(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0";
    };
    const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
    const smallEls = [...document.querySelectorAll("a,button,input,select,textarea,[role=button]")]
      .filter(visible)
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width < 32 || r.height < 32; })
      .map((el) => `${el.tagName.toLowerCase()}${el.getAttribute("aria-label") ? "[" + el.getAttribute("aria-label") + "]" : ""}"${(el.textContent || "").trim().slice(0, 18)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
    const brokenImgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute("src")).map((i) => i.getAttribute("src").slice(0, 80));
    const noAlt = [...document.images].filter((i) => !i.hasAttribute("alt")).length;
    const unnamedBtns = [...document.querySelectorAll("button,a")].filter(visible)
      .filter((b) => !(b.textContent || "").trim() && !b.getAttribute("aria-label") && !b.querySelector("img[alt]:not([alt=''])")).length;
    const lcp = performance.getEntriesByType("largest-contentful-paint").at(-1);
    const cls = performance.getEntriesByType("layout-shift").filter((e) => !e.hadRecentInput).reduce((a, e) => a + e.value, 0);
    const h1 = [...document.querySelectorAll("h1")].map((h) => h.textContent.trim().slice(0, 40));
    const fonts = [...new Set([...document.querySelectorAll("h1,h2,h3,p,button,a")].slice(0, 200).map((e) => getComputedStyle(e).fontFamily.split(",")[0]))];
    return {
      title: document.title, h1, overflow, small: smallEls.length, smallSample: smallEls.slice(0, 6),
      brokenImgs, noAlt, unnamedBtns, nodes: document.querySelectorAll("*").length, imgs: document.images.length,
      lcp: lcp ? Math.round(lcp.startTime) : null, lcpEl: lcp?.element ? lcp.element.tagName + "." + String(lcp.element.className).slice(0, 30) : null,
      cls: +cls.toFixed(3), fonts,
    };
  });
}

(async () => {
  const browser = await chromium.launch();
  const modes = MODE === "both" ? ["mobile", "desktop"] : [MODE];
  const report = {};
  for (const mode of modes) {
    const ctx = await browser.newContext({ ...VPS[mode], ignoreHTTPSErrors: true });
    const { hostname } = new URL(BASE);
    await ctx.addCookies([{ name: "bb-store", value: STORE, domain: hostname, path: "/" }]);
    await ctx.addInitScript(() => {
      window.__lcp = null;
      try { new PerformanceObserver(() => {}).observe({ type: "largest-contentful-paint", buffered: true }); } catch {}
      try { new PerformanceObserver(() => {}).observe({ type: "layout-shift", buffered: true }); } catch {}
    });
    const page = await ctx.newPage();
    const errs = []; const failed = [];
    page.on("pageerror", (e) => errs.push("PAGEERR " + e.message.slice(0, 140)));
    page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 140)); });
    page.on("response", (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) failed.push(`${r.status()} ${r.url().replace(BASE, "").slice(0, 90)}`); });

    // discover a product + theme from the menu/home
    const routes = [...STATIC_ROUTES];
    await page.goto(BASE + `/store/${STORE}/menu`, { waitUntil: "networkidle", timeout: 60000 });
    const prod = await page.evaluate((s) => [...document.querySelectorAll(`a[href*="/store/${s}/menu/"]`)].map((a) => a.getAttribute("href"))[0], STORE);
    if (prod) routes.splice(2, 0, ["product", prod]);
    await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
    const theme = await page.evaluate(() => [...document.querySelectorAll('a[href^="/themes/"]')].map((a) => a.getAttribute("href"))[0]);
    if (theme) routes.splice(3, 0, ["theme", theme]);

    report[mode] = [];
    for (const [name, route] of routes) {
      errs.length = 0; failed.length = 0;
      const t0 = Date.now();
      let status = 0;
      try {
        const res = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
        status = res ? res.status() : 0;
      } catch (e) { errs.push("NAV " + e.message.slice(0, 100)); }
      const dom = Date.now() - t0;
      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
      const idle = Date.now() - t0;
      await page.waitForTimeout(800);
      const a = await audit(page).catch((e) => ({ err: e.message }));
      await page.screenshot({ path: path.join(OUT, `${mode[0]}-${name}.png`) }).catch(() => {});
      if (process.env.FULL) await page.screenshot({ path: path.join(OUT, `${mode[0]}-${name}-full.png`), fullPage: true }).catch(() => {});
      const row = { name, route, status, dom, idle, finalUrl: page.url().replace(BASE, ""), ...a, errors: [...new Set(errs)], failed: [...new Set(failed)] };
      report[mode].push(row);
      console.log(`[${mode}] ${name.padEnd(10)} ${status} dom=${dom} idle=${idle} lcp=${a.lcp} cls=${a.cls} ovf=${a.overflow} small=${a.small} broken=${(a.brokenImgs || []).length} noAlt=${a.noAlt} unnamed=${a.unnamedBtns} errs=${row.errors.length} failed=${row.failed.length} -> ${row.finalUrl}`);
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
})();
