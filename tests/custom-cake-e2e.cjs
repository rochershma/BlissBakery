// Custom cake request: signed-in customer fills the form, attaches a photo,
// submits; then the request shows in the admin inbox and can be quoted.
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { adminContext } = require("./_session.cjs");
const db = new PrismaClient();

const BASE = process.env.BASE || "http://localhost:3005";
const OUT = path.join(__dirname, "..", ".audit");
const W = Number(process.env.W || 390);
const results = [];
const check = (ok, n, d = "") => { results.push(ok); console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${d ? " - " + d : ""}`); };

(async () => {
  const b = await chromium.launch();
  const mobile = W < 768;
  const { page } = await adminContext(b, BASE, { viewport: { width: W, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message.slice(0, 120)));
  page.on("console", (m) => { if (m.type() === "error" && !/status of 4\d\d/.test(m.text())) errs.push(m.text().slice(0, 120)); });

  await page.goto(BASE + "/store/kuchaman-city/custom-cakes", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(OUT, `cc-${W}-form.png`), fullPage: true });
  check(await page.locator(".cc5__style").count() > 0, "inspiration tiles have real artwork", `${await page.locator(".cc5__style img").count()} images`);
  const emoji = await page.evaluate(() => /[\u{1F300}-\u{1FAFF}]/u.test(document.querySelector("main, .cc5")?.textContent || ""));
  check(!emoji, "no emojis in the form");

  // empty submit shows what is missing
  await page.getByRole("button", { name: /request a quote/i }).click();
  check(await page.locator(".opt-block.is-err").count() >= 2, "empty submit highlights missing sections");

  await page.locator(".cc5__style").first().click();
  await page.locator(".sizes__o").nth(1).click();
  await page.locator(".opt-block").filter({ hasText: "Flavour" }).locator(".chip").first().click();
  await page.fill("#cc-msg", "Happy Birthday Test");
  await page.locator(".dpick__d").nth(2).click();

  // photo upload
  const png = path.join(OUT, "ref.png");
  fs.copyFileSync(path.join(__dirname, "..", "public", "icons", "icon-192.png"), png);
  await page.setInputFiles('input[type="file"]', png);
  await page.waitForSelector(".cc5__photo img", { timeout: 20000 }).catch(() => {});
  check(await page.locator(".cc5__photo img").count() === 1, "reference photo uploads");

  if (!(await page.inputValue("#cc-name"))) await page.fill("#cc-name", "Test Customer");
  await page.getByRole("button", { name: /request a quote/i }).click();
  await page.waitForSelector(".cc5__done", { timeout: 20000 }).catch(() => {});
  const ref = await page.locator(".cc5__done b").first().textContent().catch(() => null);
  check(Boolean(ref && /^CC-/.test(ref)), "request is accepted", ref || "no reference");
  await page.screenshot({ path: path.join(OUT, `cc-${W}-done.png`) });

  const row = ref ? await db.customCakeOrder.findUnique({ where: { orderNumber: ref }, include: { store: true } }) : null;
  check(row?.store?.slug === "kuchaman-city", "request is tied to the outlet", row?.store?.slug);
  check((JSON.parse(row?.referenceImages || "[]")).length === 1, "photo URL saved on the request");

  // forged image URL is refused
  const forged = await page.evaluate(async () => {
    const r = await fetch("/api/custom-cakes", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName: "X Y", customerPhone: "9876543210", cakeSize: "1 Kg", baseFlavour: "Vanilla", referenceImages: ["https://evil.example/x.png"] }) });
    return r.status;
  });
  check(forged === 400, "foreign image URLs are refused", `${forged}`);

  await page.goto(BASE + "/admin/custom-cakes", { waitUntil: "networkidle" });
  check(await page.getByText(ref || "none").count() > 0, "admin inbox shows the request");
  await page.screenshot({ path: path.join(OUT, `cc-${W}-admin.png`), fullPage: false });

  if (row) {
    const card = page.locator("div.bg-white.rounded-2xl", { hasText: ref });
    await card.locator('select[name="status"]').selectOption("QUOTED");
    await card.locator('input[name="quotedPrice"]').fill("1850");
    await card.getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(1500);
    const after = await db.customCakeOrder.findUnique({ where: { id: row.id } });
    check(after.status === "QUOTED" && after.quotedPrice === 1850, "admin can quote it", `${after.status} ${after.quotedPrice}`);
    await db.customCakeOrder.delete({ where: { id: row.id } });
  }

  check(errs.length === 0, "no page errors", errs.join(" | "));
  console.log(`  ${results.filter(Boolean).length}/${results.length} passed`);
  await b.close();
  await db.$disconnect();
  process.exit(results.every(Boolean) ? 0 : 1);
})();
