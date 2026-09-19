// Logs in, seeds the cart, then screenshots cart + checkout.
// node tests/flow-shots.cjs mobile|desktop
const { chromium } = require("playwright");
const BASE = "http://localhost:3005";
const OUT = "q:/src/poc/bakes/blissbakery-v2/design/audit";
const PHONE = "9602831559";
const OTP = "999999";
const mode = process.argv[2] || "mobile";

const VP = mode === "mobile"
  ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
  : { viewport: { width: 1440, height: 950 } };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext(VP);
  const page = await ctx.newPage();
  const p = mode[0];

  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(900);

  // login
  await page.getByRole("button", { name: /sign in/i }).first().click();
  await page.waitForTimeout(1000);
  await page.locator('input[type="tel"]').first().fill(PHONE);
  await page.getByRole("button", { name: /send code/i }).first().click();
  await page.waitForTimeout(2200);
  const boxes = page.locator('input[maxlength="1"]');
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill(OTP[i]);
  await page.waitForTimeout(400);
  const v = page.getByRole("button", { name: /verify/i }).first();
  if (await v.count()) await v.click();
  await page.waitForTimeout(2500);

  // add a product
  await page.goto(BASE + "/store/kuchaman-city/menu", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.locator(".card").first().click();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${OUT}/${p}-pdp.png` });
  const add = page.getByRole("button", { name: /add to cart/i }).first();
  if (await add.count()) { await add.click(); await page.waitForTimeout(1400); }

  for (const [name, url] of [["cart", "/cart"], ["checkout", "/checkout"]]) {
    await page.goto(BASE + url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${OUT}/${p}-${name}.png` });
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${p}-${name}-2.png` });
    console.log(`${p}-${name}.png`);
  }
  await b.close();
})();
