const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const OUT = path.join(__dirname, "..", ".audit", "ui");
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || "http://localhost:3005";
const STORE = "kuchaman-city";

(async () => {
  const b = await chromium.launch();
  for (const [w, h, tag] of [[390, 844, "m"], [1440, 900, "d"]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768, deviceScaleFactor: 2 });
    await ctx.addCookies([{ name: "bb-store", value: STORE, domain: new URL(BASE).hostname, path: "/" }]);
    const p = await ctx.newPage();
    const shot = async (n, full) => { await p.waitForTimeout(700); await p.screenshot({ path: path.join(OUT, `${tag}-${n}.png`), fullPage: !!full }); };

    await p.goto(BASE + `/store/${STORE}/menu`, { waitUntil: "networkidle" });
    await shot("menu", true);
    await p.goto(BASE + "/cakes/birthday", { waitUntil: "networkidle" });
    await shot("occasion");
    // product
    await p.goto(BASE + `/store/${STORE}/menu`, { waitUntil: "networkidle" });
    await p.locator('a[href*="/menu/"]').first().click();
    await p.waitForLoadState("networkidle");
    await p.waitForTimeout(800);
    await shot("pdp", true);
    // add to cart -> cart
    const add = p.getByRole("button", { name: /add to cart/i }).first();
    if (await add.count()) { await add.click(); await p.waitForTimeout(800); }
    await p.goto(BASE + "/cart", { waitUntil: "networkidle" });
    await shot("cart", true);
    await ctx.close();
  }
  await b.close();
  console.log("done");
})();
