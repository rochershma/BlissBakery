const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:3005";
const OUT = "q:/src/poc/bakes/blissbakery-v2/design/audit";

// node tests/shots.cjs mobile home /   -> writes audit/m-home.png
const [mode, ...rest] = process.argv.slice(2);
const pairs = [];
for (let i = 0; i < rest.length; i += 2) pairs.push([rest[i], rest[i + 1]]);

const VP = mode === "mobile"
  ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" }
  : { viewport: { width: 1440, height: 950 } };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext(VP);
  const p = await ctx.newPage();
  for (const [name, route] of pairs) {
    await p.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 });
    await p.waitForTimeout(1400);
    await p.screenshot({ path: `${OUT}/${mode[0]}-${name}.png`, fullPage: false });
    console.log(`${mode[0]}-${name}.png`);
  }
  await b.close();
})();
