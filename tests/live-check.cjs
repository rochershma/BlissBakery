// Verifies the live origin over HTTPS via the public hostname.
// Runs from anywhere by resolving blissbakery.shop -> the origin IP.
const { chromium } = require("playwright");

const ORIGIN_IP = process.env.ORIGIN_IP || "172.187.217.79";
const HOST = process.env.HOST_NAME || "blissbakery.shop";
// Corporate proxies often block by SNI hostname; BASE lets us test the origin
// directly by IP while still exercising real TLS.
const BASE = process.env.BASE || `https://${HOST}`;

const results = [];
const check = (ok, n, d = "") => {
  results.push({ ok, n, d });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${d ? " - " + d : ""}`);
};

const ROUTES = ["/", "/store/kuchaman-city/menu", "/cakes/birthday", "/search?q=cake", "/cart", "/api/health"];

(async () => {
  const browser = await chromium.launch({
    // Point the hostname at the origin and accept the self-signed origin cert
    // (Cloudflare terminates the public cert; this tests the origin itself).
    args: [`--host-resolver-rules=MAP ${HOST} ${ORIGIN_IP}`],
    ignoreHTTPSErrors: true,
  });

  for (const [w, label] of [[1440, "desktop"], [390, "mobile"]]) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: 900 },
      isMobile: w < 768,
      hasTouch: w < 768,
      ignoreHTTPSErrors: true,
    });
    console.log(`\n=== ${label} ===`);
    for (const route of ROUTES) {
      const page = await ctx.newPage();
      const errors = [];
      // A self-signed origin cert blocks service-worker registration; that's an
      // artifact of the placeholder cert, not an app fault.
      const ignorable = (t) => /favicon|SSL certificate error occurred when fetching the script/i.test(t);
      page.on("pageerror", (e) => { if (!ignorable(e.message)) errors.push(e.message.slice(0, 80)); });
      page.on("console", (m) => { if (m.type() === "error" && !ignorable(m.text())) errors.push(m.text().slice(0, 80)); });

      let status = 0;
      try {
        const r = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 });
        status = r.status();
        await page.waitForTimeout(600);
      } catch (e) { errors.push("NAV " + e.message.slice(0, 60)); }

      const probe = await page.evaluate(() => ({
        css: [...document.styleSheets].reduce((n, s) => { try { return n + s.cssRules.length; } catch { return n; } }, 0),
        brokenImgs: [...document.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth === 0).length,
        insecure: performance.getEntriesByType("resource").filter((r) => r.name.startsWith("http://")).length,
      })).catch(() => ({ css: 0, brokenImgs: 0, insecure: 0 }));

      const issues = [];
      if (status !== 200) issues.push(`status=${status}`);
      if (route !== "/api/health" && probe.css < 300) issues.push(`css=${probe.css}`);
      if (probe.brokenImgs) issues.push(`brokenImgs=${probe.brokenImgs}`);
      if (probe.insecure) issues.push(`mixed-content=${probe.insecure}`);
      if (errors.length) issues.push(errors[0]);

      check(issues.length === 0, `${label} ${route}`, issues.join(" "));
      await page.close();
    }
    await ctx.close();
  }

  await browser.close();
  const ok = results.filter((r) => r.ok).length;
  console.log("\n" + "=".repeat(56));
  console.log(`  ${ok}/${results.length} live checks passed`);
  console.log("=".repeat(56));
  process.exit(ok === results.length ? 0 : 1);
})();
