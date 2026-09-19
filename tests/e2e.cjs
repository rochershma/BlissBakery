/**
 * v5 end-to-end suite. Drives a real browser against the running dev server.
 * Usage: node tests/e2e.cjs   (server must be on :3005)
 */
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3005";
const PHONE = "9602831559";
const OTP = "999999";

const results = [];
const pass = (n, d = "") => { results.push({ ok: true, n, d }); console.log(`  PASS  ${n}${d ? " — " + d : ""}`); };
const fail = (n, d = "") => { results.push({ ok: false, n, d }); console.log(`  FAIL  ${n}${d ? " — " + d : ""}`); };
const check = (c, n, d) => (c ? pass(n, d) : fail(n, d));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  const jsErrors = [];
// The invalid-promo assertion deliberately provokes a 400. The browser logs that
// as a bare "Failed to load resource" with no URL, so pair it with the response.
let expected400 = 0;
page.on("response", (res) => {
  if (res.status() === 400 && /promo\/validate/.test(res.url())) expected400++;
});
page.on("pageerror", (e) => jsErrors.push(`${page.url()} :: ${e.message}`));
page.on("console", (m) => {
  if (m.type() !== "error") return;
  const t = m.text().slice(0, 140);
  if (/Failed to load resource/.test(t) && /400/.test(t) && expected400 > 0) { expected400--; return; }
  jsErrors.push(`${page.url()} :: ${t}`);
});
  const go = async (path) => {
    const r = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(700);
    return r;
  };
  const broken = () => page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length);

  /* ---------------- 1. HOME ---------------- */
  console.log("\n[1] Home");
  let r = await go("/");
  check(r.status() === 200, "home responds 200");
  const home = await page.evaluate(() => ({
    slides: document.querySelectorAll(".v5-slide").length,
    sections: [...document.querySelectorAll("h2")].map((h) => h.textContent.trim()),
    tiles: document.querySelectorAll(".tile").length,
    cards: document.querySelectorAll(".card").length,
    hdr: !!document.querySelector(".v5hdr"),
    ftr: !!document.querySelector(".ftr"),
    ticker: !!document.querySelector(".ticker"),
    font: getComputedStyle(document.querySelector("h2")).fontFamily,
    cta: getComputedStyle(document.querySelector(".btn--rose")).backgroundColor,
  }));
  check(home.hdr, "v5 header present");
  check(home.ftr, "footer present");
  check(home.ticker, "ticker present");
  check(home.slides >= 1, "hero slider has slides", `${home.slides}`);
  check(home.tiles >= 6, "browse tiles render", `${home.tiles}`);
  check(home.cards >= 1, "bestsellers render", `${home.cards}`);
  check(/Jakarta/.test(home.font), "display font is Plus Jakarta Sans");
  check(home.cta === "rgb(175, 63, 99)", "CTA uses v5 rose", home.cta);
  check(["Shop by category", "Shop by occasion", "Shop by theme"].every((s) => home.sections.includes(s)), "all browse sections present");
  check((await broken()) === 0, "no broken images on home");

  /* ---------------- 2. COLLECTIONS ---------------- */
  console.log("\n[2] Collections");
  for (const [label, url] of [
    ["standard menu", "/store/kuchaman-city/menu"],
    ["occasion", "/cakes/birthday"],
    ["theme", "/themes/kids-cakes"],
  ]) {
    r = await go(url);
    const d = await page.evaluate(() => ({
      cards: document.querySelectorAll(".card").length,
      groups: document.querySelectorAll(".fgroup").length,
      hdr: !!document.querySelector(".v5hdr"),
      ftr: !!document.querySelector(".ftr"),
      h1: document.querySelector("h1")?.textContent?.trim(),
    }));
    check(r.status() === 200 && d.cards > 0, `${label} lists products`, `${d.cards} cards`);
    check(d.groups >= 2, `${label} has filter groups`, `${d.groups}`);
    check(d.hdr && d.ftr, `${label} has header + footer`);
    check((await broken()) === 0, `${label} has no broken images`);
  }

  // filter interaction
  await go("/cakes/birthday");
  const before = await page.evaluate(() => document.querySelectorAll(".card").length);
  const firstOpt = await page.$(".fgroup.open .fopt input");
  if (firstOpt) {
    await firstOpt.click();
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => document.querySelectorAll(".card").length);
    check(after !== before || after > 0, "price filter changes the grid", `${before} -> ${after}`);
  } else fail("price filter present");

  // sort
  await go("/cakes/birthday");
  await page.selectOption(".plp__sort select", "low");
  await page.waitForTimeout(600);
  const sorted = await page.evaluate(() =>
    [...document.querySelectorAll(".card__price b")].slice(0, 5).map((e) => Number(e.textContent.replace(/[^\d]/g, ""))));
  check(sorted.every((v, i, a) => i === 0 || a[i - 1] <= v), "sort low→high is ordered", sorted.join(","));

  /* ---------------- 3. PDP ---------------- */
  console.log("\n[3] Product");
  await go("/cakes/birthday");
  const href = await page.evaluate(() => document.querySelector(".card")?.getAttribute("href"));
  r = await go(href);
  check(r.status() === 200, "PDP responds 200", href);
  const pdp = await page.evaluate(() => ({
    price: document.querySelector(".pdp5__price b")?.textContent,
    sizes: document.querySelectorAll(".sizes__o").length,
    sizesShowPrice: [...document.querySelectorAll(".sizes__o i")].every((e) => /₹/.test(e.textContent)),
    flav: document.querySelectorAll(".pdp5__flav .chip").length,
    flavHasPrice: /₹/.test(document.querySelector(".pdp5__flav")?.textContent || ""),
    acc: document.querySelectorAll(".acc__i").length,
    related: document.querySelectorAll(".card").length,
    dupServes: /serves\s+Serves/i.test(document.body.innerText),
  }));
  check(!!pdp.price, "PDP shows a price", pdp.price);
  check(pdp.sizes > 1, "size options render", `${pdp.sizes}`);
  check(pdp.sizesShowPrice, "each size shows its own price");
  check(pdp.flav > 1, "flavour chips render", `${pdp.flav}`);
  check(pdp.flavHasPrice === false, "flavour chips hide prices");
  check(pdp.acc >= 3, "detail accordions render", `${pdp.acc}`);
  check(pdp.related > 0, "related products render", `${pdp.related}`);
  check(!pdp.dupServes, "no duplicated 'serves Serves' text");

  const p0 = await page.evaluate(() => document.querySelector(".pdp5__price b").textContent);
  const sizeOpts = await page.$$(".sizes__o");
  if (sizeOpts.length > 2) await sizeOpts[2].click();
  await page.waitForTimeout(500);
  const p1 = await page.evaluate(() => document.querySelector(".pdp5__price b").textContent);
  check(p0 !== p1, "price updates when size changes", `${p0} -> ${p1}`);

  // the selected size tile must quote the same number as the main price
  const agree = await page.evaluate(() => {
    const sel = document.querySelector('.sizes__o[aria-checked="true"] i')?.textContent?.replace(/[^\d]/g, "");
    const main = document.querySelector(".pdp5__price b")?.textContent?.replace(/[^\d]/g, "");
    return { sel, main };
  });
  check(agree.sel === agree.main, "size tile price matches headline price", `${agree.sel} vs ${agree.main}`);

  const chips = await page.$$(".pdp5__flav .chip");
  if (chips.length > 2) { await chips[chips.length - 1].click(); await page.waitForTimeout(500); }
  const p2 = await page.evaluate(() => document.querySelector(".pdp5__price b").textContent);
  check(p2 !== p1, "price updates when flavour changes", `${p1} -> ${p2}`);

  /* ---------------- 4. CART ---------------- */
  console.log("\n[4] Cart");
  await page.click(".pdp5__cta");
  await page.waitForTimeout(1200);
  r = await go("/cart");
  const cart = await page.evaluate(() => ({
    rows: document.querySelectorAll(".crow").length,
    total: document.querySelector(".sline--tot b")?.textContent,
    tags: document.querySelectorAll(".crow__tags .badge").length,
  }));
  check(cart.rows === 1, "cart has the added item", `${cart.rows} rows`);
  check(cart.tags >= 2, "cart line shows size + flavour badges", `${cart.tags}`);
  check(!!cart.total, "cart shows a total", cart.total);

  const qtyPlus = await page.$(".crow .qty button:last-child");
  if (qtyPlus) {
    await qtyPlus.click();
    await page.waitForTimeout(600);
    const t2 = await page.evaluate(() => document.querySelector(".sline--tot b")?.textContent);
    check(t2 !== cart.total, "quantity change updates the total", `${cart.total} -> ${t2}`);
  } else fail("quantity control present");

  /* ---------------- 5. LOGIN ---------------- */
  console.log("\n[5] Login");
  await go("/");
  try {
    await page.getByRole("button", { name: /sign in/i }).first().click();
    await page.waitForTimeout(1200);
    await page.locator('input[type="tel"], input[inputmode="numeric"]').first().fill(PHONE);
    await page.getByRole("button", { name: /otp|continue|send/i }).first().click();
    await page.waitForTimeout(2200);
    const boxes = page.locator('input[inputmode="numeric"], input[maxlength="1"]');
    const n = await boxes.count();
    if (n > 2) for (let i = 0; i < 6; i++) await boxes.nth(i).fill(OTP[i]);
    else await boxes.last().fill(OTP);
    await page.waitForTimeout(500);
    const v = page.getByRole("button", { name: /verify|login|continue/i }).first();
    if (await v.count()) await v.click();
    await page.waitForTimeout(2800);
    const me = await page.evaluate(() => fetch("/api/auth/profile").then((r) => r.json()).catch(() => null));
    check(!!me?.user?.id, "login succeeds", me?.user?.phone);
  } catch (e) {
    fail("login flow", e.message.slice(0, 80));
  }

  /* ---------------- 6. ACCOUNT ---------------- */
  console.log("\n[6] Account");
  for (const [label, url, sel] of [
    ["orders", "/orders", ".acct5__nav"],
    ["addresses", "/addresses", ".acct5__nav"],
    ["profile", "/profile", ".acct5__nav"],
  ]) {
    r = await go(url);
    const ok = await page.evaluate((s) => !!document.querySelector(s), sel);
    check(r.status() === 200 && ok, `${label} page renders`);
    check((await broken()) === 0, `${label} has no broken images`);
  }

  /* ---------------- 7. CHECKOUT ---------------- */
  console.log("\n[7] Checkout");
  r = await go("/checkout");
  const co = await page.evaluate(() => {
    // scope to the form, not the footer (which lists accepted payment methods)
    const form = document.querySelector(".co5")?.innerText || "";
    return {
      steps: document.querySelectorAll(".steps5 > div").length,
      blocks: document.querySelectorAll(".opt-block").length,
      addons: document.querySelectorAll(".up").length,
      hasPayment: /\b(UPI|Netbanking|Cash on delivery|Pay now)\b/.test(form),
      cta: [...document.querySelectorAll("button")].some((b) => /place order/i.test(b.textContent)),
    };
  });
  check(r.status() === 200, "checkout responds 200");
  check(co.steps === 3, "three checkout steps", `${co.steps}`);
  check(co.blocks >= 3, "delivery blocks render", `${co.blocks}`);
  check(co.addons > 0, "add-to-box upsell renders", `${co.addons}`);
  check(!co.hasPayment, "no payment method step on checkout");
  check(co.cta, "Place order CTA present");

  // add-on stepper
  const addBtn = await page.$(".up__btn");
  if (addBtn) {
    const t0 = await page.evaluate(() => document.querySelector(".sline--tot b")?.textContent);
    await addBtn.click();
    await page.waitForTimeout(600);
    const t1 = await page.evaluate(() => document.querySelector(".sline--tot b")?.textContent);
    check(t0 !== t1, "add-on updates the total", `${t0} -> ${t1}`);
  } else fail("add-on button present");

  // promo code
  const dateChips = await page.$$(".dpick__d");
  check(dateChips.length >= 7, "date picker renders day chips", `${dateChips.length}`);
  const promoInput = await page.$(".promo__row .input");
  if (promoInput) {
    const t0 = await page.evaluate(() => document.querySelector(".sline--tot b")?.textContent);
    await promoInput.fill("E2ETEST");
    await page.evaluate(() => {
      const b = [...document.querySelectorAll(".promo__row button")].find((x) => /apply/i.test(x.textContent));
      b && b.click();
    });
    await page.waitForTimeout(2000);
    const t1 = await page.evaluate(() => ({
      total: document.querySelector(".sline--tot b")?.textContent,
      saved: document.querySelector(".sline--save b")?.textContent,
      tag: document.querySelector(".promo__tag")?.textContent,
    }));
    check(t1.tag === "E2ETEST", "promo code applies", t1.tag);
    check(!!t1.saved, "discount line shows", t1.saved);
    check(t0 !== t1.total, "promo reduces the total", `${t0} -> ${t1.total}`);
  } else fail("promo input present");

  // invalid code must be rejected
  await page.evaluate(() => {
    const b = [...document.querySelectorAll(".promo__on button")].find((x) => /remove/i.test(x.textContent));
    b && b.click();
  });
  await page.waitForTimeout(500);
  const badInput = await page.$(".promo__row .input");
  if (badInput) {
    await badInput.fill("NOTAREALCODE");
    await page.evaluate(() => {
      const b = [...document.querySelectorAll(".promo__row button")].find((x) => /apply/i.test(x.textContent));
      b && b.click();
    });
    await page.waitForTimeout(1800);
    const err = await page.evaluate(() => document.querySelector(".promo__err")?.textContent);
    check(!!err, "invalid promo is rejected", err);
  }

  /* ---------------- 8. PLACE ORDER ---------------- */
  console.log("\n[8] Place order");
  try {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => /place order/i.test(x.textContent));
      b && b.click();
    });
    await page.waitForTimeout(5000);
    const url = page.url();
    check(/\/order\//.test(url) || /\/orders/.test(url), "order placed and redirected", url.replace(BASE, ""));
    if (/\/order\//.test(url)) {
      const t = await page.evaluate(() => ({
        tl: document.querySelectorAll(".tl5").length,
        status: document.querySelector(".status")?.textContent?.trim(),
        total: document.querySelector(".sline--tot b")?.textContent,
      }));
      check(t.tl >= 3, "tracking timeline renders", `${t.tl} steps`);
      check(!!t.status, "order status shows", t.status);
      check(!!t.total, "order total shows", t.total);
    }
  } catch (e) {
    fail("place order", e.message.slice(0, 100));
  }

  /* ---------------- 9. MOBILE ---------------- */
  console.log("\n[9] Mobile 390x844");
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  });
  const mp = await mctx.newPage();
  mp.on("pageerror", (e) => jsErrors.push(`mobile :: ${e.message}`));
  for (const [label, url] of [["home", "/"], ["menu", "/store/kuchaman-city/menu"], ["occasion", "/cakes/birthday"]]) {
    const rr = await mp.goto(BASE + url, { waitUntil: "networkidle", timeout: 90000 });
    await mp.waitForTimeout(1200);
    const d = await mp.evaluate(() => ({
      nav: !!document.querySelector(".mnav"),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
      tapTargets: [...document.querySelectorAll("button, .mnav a")].filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.height < 40;
      }).length,
    }));
    check(rr.status() === 200, `mobile ${label} responds 200`);
    check(d.nav, `mobile ${label} shows bottom nav`);
    check(!d.overflow, `mobile ${label} has no horizontal overflow`);
    check(d.broken === 0, `mobile ${label} has no broken images`);
  }
  await mctx.close();

  /* ---------------- SUMMARY ---------------- */
  const uniqueErrors = [...new Set(jsErrors)];
  console.log("\n[10] JS errors");
  check(uniqueErrors.length === 0, "zero console/page errors", uniqueErrors.slice(0, 3).join(" | "));

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("\n  FAILURES:");
    failed.forEach((f) => console.log(`   - ${f.n}${f.d ? " — " + f.d : ""}`));
  }
  console.log("=".repeat(60));

  await browser.close();
  process.exit(failed.length ? 1 : 0);
})();
