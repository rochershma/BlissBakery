// Measures server response, image payload and LCP for key routes.
const { chromium } = require("playwright");
const BASE = "http://localhost:3005";

const ROUTES = ["/", "/store/kuchaman-city/menu", "/cakes/birthday"];

(async () => {
  const b = await chromium.launch();
  for (const [w, label] of [[390, "mobile"], [1440, "desktop"]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 768, hasTouch: w < 768 });
    console.log(`\n=== ${label} ===`);
    for (const route of ROUTES) {
      const page = await ctx.newPage();
      let imgBytes = 0, imgCount = 0, imgAboveFold = 0;
      page.on("response", async (res) => {
        const ct = res.headers()["content-type"] || "";
        if (!/^image\//.test(ct)) return;
        imgCount++;
        const len = Number(res.headers()["content-length"] || 0);
        imgBytes += len;
      });

      const t0 = Date.now();
      await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
      const domMs = Date.now() - t0;
      await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
      const idleMs = Date.now() - t0;

      const m = await page.evaluate(() => {
        const imgs = [...document.querySelectorAll("img")];
        const vh = window.innerHeight;
        return {
          imgs: imgs.length,
          eager: imgs.filter((i) => i.loading !== "lazy").length,
          aboveFold: imgs.filter((i) => i.getBoundingClientRect().top < vh).length,
          lazyAboveFold: imgs.filter((i) => i.loading === "lazy" && i.getBoundingClientRect().top < vh).length,
          lcp: performance.getEntriesByType("largest-contentful-paint").at(-1)?.startTime,
        };
      });

      console.log(
        `  ${route.padEnd(30)} dom=${String(domMs).padStart(4)}ms idle=${String(idleMs).padStart(5)}ms ` +
        `imgs=${String(m.imgs).padStart(3)} eager=${m.eager} aboveFold=${m.aboveFold} lazyAboveFold=${m.lazyAboveFold} ` +
        `payload=${(imgBytes / 1024 / 1024).toFixed(2)}MB`
      );
      await page.close();
    }
    await ctx.close();
  }
  await b.close();
})();
