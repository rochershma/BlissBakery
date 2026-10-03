// iPhone-sized checks: SMS-only login, OTP autofill, store switch clears the basket silently.
const { chromium, devices } = require("playwright");
const BASE = process.env.BASE || "http://localhost:3005";
const results = [];
const check = (ok, n, d = "") => { results.push(ok); console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${d ? " - " + d : ""}`); };

(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ ...devices["iPhone 13"] });
  const host = new URL(BASE).hostname;
  await c.addCookies([{ name: "bb-store", value: "kuchaman-city", domain: host, path: "/" }]);
  const p = await c.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message.slice(0, 120)));

  // --- login
  await p.goto(BASE + "/profile", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /sign in/i }).first().click().catch(() => {});
  await p.waitForSelector('input[type="tel"]', { timeout: 10000 });
  const sheet = await p.evaluate(() => {
    const s = document.querySelector(".auth__sheet").getBoundingClientRect();
    return { top: Math.round(s.top), text: document.querySelector(".auth__sheet").innerText };
  });
  check(!/whatsapp/i.test(sheet.text), "login offers no WhatsApp/SMS choice");
  check(sheet.top < 80, "sheet sits near the top (clear of the keyboard)", `top ${sheet.top}`);
  const phoneAttrs = await p.$eval('input[type="tel"]', (i) => ({ ac: i.autocomplete, im: i.inputMode, fs: getComputedStyle(i).fontSize }));
  check(phoneAttrs.fs === "16px", "phone input is 16px (no iOS zoom)", phoneAttrs.fs);
  await p.fill('input[type="tel"]', "9602831559");
  // count layout jumps while moving to the OTP step
  await p.evaluate(() => { window.__tops = []; const s = document.querySelector(".auth__sheet"); const t = () => { window.__tops.push(Math.round(s.getBoundingClientRect().top)); if (window.__tops.length < 60) requestAnimationFrame(t); }; t(); });
  await p.getByRole("button", { name: /send code/i }).click();
  await p.waitForSelector('input[autocomplete="one-time-code"]', { timeout: 15000 });
  await p.waitForTimeout(600);
  const tops = await p.evaluate(() => [...new Set(window.__tops)]);
  check(tops.length <= 2, "sheet does not jump when the OTP step opens", tops.join(","));
  const sub = await p.textContent(".auth__sub");
  check(/SMS/.test(sub) && !/WhatsApp/i.test(sub), "OTP step says it was sent by SMS", sub.trim());
  // iOS one-time-code autofill drops the whole code into the first box
  await p.fill('input[autocomplete="one-time-code"]', "999999");
  await p.waitForTimeout(2500);
  const me = await p.evaluate(() => fetch("/api/auth/profile").then((r) => r.json()).catch(() => null));
  check(!!me?.user?.id, "autofilled code signs the customer in", me?.user?.phone);

  // --- store switch from the homepage strip (seed a second outlet if this DB has one)
  const { PrismaClient } = require("@prisma/client");
  const db = new PrismaClient();
  const open = await db.store.count({ where: { isOpen: true } });
  const temp = open < 2
    ? await db.store.create({ data: { name: "Temp Outlet", slug: `tmp-${Date.now()}`, address: "Main Market", city: "Tempur", state: "Rajasthan", pincode: "999999", phone: "9000000000" } })
    : null;
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.evaluate(() => localStorage.setItem("bliss-bakery-cart", JSON.stringify({ state: { items: [{ productId: "x", name: "Test", unitPrice: 100, quantity: 1 }], extras: { a: 1 }, storeSlug: "kuchaman-city" }, version: 0 })));
  await p.reload({ waitUntil: "networkidle" });
  const strip = await p.textContent(".v5here");
  check(/Ordering from/i.test(strip), "home shows which outlet is selected", strip.replace(/\s+/g, " ").trim());
  await p.click(".v5here");
  await p.waitForSelector(".v5store__i");
  const listText = await p.$$eval(".v5store__i", (n) => n.map((x) => x.innerText.replace(/\s+/g, " ").trim()));
  check(!listText.some((t) => /market/i.test(t)), "store list has no street addresses", listText.join(" | "));
  const other = p.locator('.v5store__i[aria-current="false"]').first();
  await other.click();
  await p.waitForTimeout(1500);
  check(!(await p.$(".v5swap")), "no confirmation dialog");
  const toast = await p.evaluate(() => document.body.innerText.match(/Now ordering from [^\n]+/)?.[0] || "");
  check(/Now ordering from/.test(toast), "toast names the new outlet", toast);
  const cart = await p.evaluate(() => JSON.parse(localStorage.getItem("bliss-bakery-cart") || "{}").state);
  check(cart?.items?.length === 0 && Object.keys(cart?.extras || {}).length === 0, "basket was emptied", JSON.stringify(cart?.items?.length));
  const strip2 = await p.textContent(".v5here");
  check(!/Kuchaman/.test(strip2), "home now shows the new outlet", strip2.replace(/\s+/g, " ").trim());

  // switch back so other suites start from the default outlet
  await p.click(".v5here");
  await p.waitForSelector(".v5store__i");
  await p.locator('.v5store__i[aria-current="false"]').first().click();
  await p.waitForTimeout(1200);
  if (temp) await db.store.delete({ where: { id: temp.id } }).catch(() => {});
  await db.$disconnect();

  check(errs.length === 0, "no page errors", errs.join(" | "));
  console.log(`  ${results.filter(Boolean).length}/${results.length} passed`);
  await b.close();
  process.exit(results.every(Boolean) ? 0 : 1);
})();
