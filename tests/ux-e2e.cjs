// Covers the reported issues: first-run outlet gate, brand line, login-before-
// checkout, address editing, delivery-area rejection, profile rules, iOS input
// sizing, account navigation and infinite scroll.
const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");
const { adminContext } = require("./_session.cjs");
const db = new PrismaClient();

const BASE = process.env.BASE || "http://localhost:3005";
const TAG = `fx${Date.now().toString().slice(-6)}`;

const results = [];
const check = (ok, n, d = "") => {
  results.push({ ok, n, d });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${d ? " - " + d : ""}`);
};

(async () => {
  const store = await db.store.findFirst({ orderBy: { createdAt: "asc" } });
  const backup = { servicePincodes: store.servicePincodes };
  let extraStoreId = null;

  const browser = await chromium.launch({ ignoreHTTPSErrors: true });

  try {
    /* ---------- 1. outlet gate ---------- */
    console.log("\n[1] First-run outlet gate");
    const second = await db.store.create({
      data: {
        name: `${TAG} Second`, slug: `${TAG}-second`, city: "Ajmer", state: "Rajasthan",
        address: "Station Road", pincode: "305001", phone: "9000000001", isOpen: true,
      },
    });
    extraStoreId = second.id;

    {
      const fresh = await browser.newContext({ ignoreHTTPSErrors: true });
      const p = await fresh.newPage();
      await p.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
      await p.waitForTimeout(1200);

      const gate = await p.$(".gate");
      check(!!gate, "outlet chooser blocks a first-time visitor");

      const scrollLocked = await p.evaluate(() => getComputedStyle(document.body).overflow === "hidden");
      check(scrollLocked, "page behind the chooser cannot be scrolled");

      const options = await p.$$eval(".gate__i b", (n) => n.map((x) => x.textContent.trim()));
      check(options.length >= 2, "chooser lists every open outlet", options.join(" | "));

      await p.locator(`.gate__i:has-text("${TAG}")`).first().click();
      await p.waitForTimeout(2000);
      check(!(await p.$(".gate")), "choosing an outlet dismisses the chooser");

      const city = await p.evaluate(() => document.querySelector(".v5loc b")?.textContent?.trim());
      check(city === "Ajmer", "the chosen outlet drives the header", city);

      await p.reload({ waitUntil: "networkidle" });
      await p.waitForTimeout(900);
      check(!(await p.$(".gate")), "the choice is remembered on the next visit");
      await fresh.close();
    }

    /* ---------- 2. brand ---------- */
    console.log("\n[2] Brand");
    {
      const ctx2 = await browser.newContext({ ignoreHTTPSErrors: true });
      const p = await ctx2.newPage();
      await p.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
      await p.waitForTimeout(1000);
      const gate = await p.$(".gate__i");
      if (gate) { await gate.click(); await p.waitForTimeout(1500); }

      const brand = await p.evaluate(() => {
        const el = document.querySelector(".v5brand__n");
        return el ? { text: el.textContent.trim(), colour: getComputedStyle(el).color } : null;
      });
      check(brand?.text === "Bliss Bakery", "brand always reads Bliss Bakery", brand?.text);
      check(!(await p.$(".v5brand__s")), "the city is no longer part of the brand lockup");
      // rgb(175, 63, 99) is the rose CTA colour
      check(/175,\s*63,\s*99/.test(brand?.colour ?? ""), "brand wordmark is pink, not near-black", brand?.colour);
      await ctx2.close();
    }

    /* ---------- 3. iOS input sizing ---------- */
    console.log("\n[3] iOS input sizing");
    {
      const ctx3 = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
      const p = await ctx3.newPage();
      await p.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
      const g = await p.$(".gate__i");
      if (g) { await g.click(); await p.waitForTimeout(1500); }

      const product = await db.product.findFirst({
        where: { isAvailable: true, category: { storeId: store.id } },
        select: { slug: true },
      });
      await p.goto(`${BASE}/store/${store.slug}/menu/${product.slug}`, { waitUntil: "networkidle" });
      await p.waitForTimeout(800);

      const small = await p.evaluate(() =>
        [...document.querySelectorAll("input, textarea, select")]
          .filter((el) => el.offsetParent !== null)
          .map((el) => ({ tag: el.tagName, size: parseFloat(getComputedStyle(el).fontSize) }))
          .filter((x) => x.size < 16));
      check(small.length === 0, "no visible field is under 16px on a phone", JSON.stringify(small.slice(0, 3)));
      await ctx3.close();
    }

    /* ---------- signed-in checks ---------- */
    const { ctx, page } = await adminContext(browser, BASE);
    const go = (u) => page.goto(BASE + u, { waitUntil: "networkidle", timeout: 60000 });
    const api = (path, opts) => page.evaluate(async ([pp, o]) => {
      const r = await fetch(pp, o || undefined);
      let body = null; try { body = await r.json(); } catch {}
      return { status: r.status, body };
    }, [path, opts]);

    await page.context().addCookies([{ name: "bb-store", value: store.slug, url: BASE }]);

    /* ---------- 4. login before checkout ---------- */
    console.log("\n[4] Checkout requires sign-in");
    {
      const anon = await browser.newContext({ ignoreHTTPSErrors: true });
      await anon.addCookies([{ name: "bb-store", value: store.slug, url: BASE }]);
      const p = await anon.newPage();
      await p.goto(BASE + "/checkout", { waitUntil: "networkidle", timeout: 60000 });
      await p.waitForTimeout(1500);
      const text = await p.evaluate(() => document.body.innerText);
      check(/sign in to check out/i.test(text), "signed-out checkout asks for sign-in first");
      check(!(await p.$(".summary5__cta")), "the order form is not rendered before sign-in");
      await anon.close();
    }

    /* ---------- 5. profile ---------- */
    console.log("\n[5] Profile");
    await go("/profile");
    await page.waitForTimeout(800);

    const phoneShown = await page.evaluate(() =>
      [...document.querySelectorAll("input")].some((i) => /\+91/.test(i.value) && i.disabled));
    check(phoneShown, "profile shows the phone number and locks it");

    const me = await api("/api/auth/profile");
    const hadEmail = Boolean(me.body?.user?.email);

    const saved = await api("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${TAG} Tester` }),
    });
    check(saved.status === 200 && saved.body?.success, "saving the profile works", `HTTP ${saved.status}`);

    if (!hadEmail) {
      const add = await api("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${TAG} Tester`, email: `${TAG}@example.com` }),
      });
      check(add.body?.success, "a customer can add an email once");
    }

    const change = await api("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${TAG} Tester`, email: `${TAG}-changed@example.com` }),
    });
    check(change.status === 400, "email cannot be changed once set", `HTTP ${change.status}`);

    await go("/profile");
    await page.waitForTimeout(700);
    const emailLocked = await page.evaluate(() =>
      [...document.querySelectorAll('input[type="email"]')].every((i) => i.disabled));
    check(emailLocked, "the email field is disabled once set");

    /* ---------- 6. addresses ---------- */
    console.log("\n[6] Addresses");
    await db.store.update({ where: { id: store.id }, data: { servicePincodes: "" } });

    const created = await api("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "Home", fullAddress: `${TAG} House 1`, pincode: store.pincode, city: store.city }),
    });
    check(created.status === 201, "an in-area address saves", `HTTP ${created.status}`);
    const addrId = created.body?.address?.id;

    const outside = await api("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "Home", fullAddress: `${TAG} Far away`, pincode: "999999", city: "Nowhere" }),
    });
    check(outside.status === 400, "an out-of-area address is rejected", outside.body?.error ?? `HTTP ${outside.status}`);

    const edited = await api(`/api/addresses?id=${addrId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "Work", fullAddress: `${TAG} House 2`, pincode: store.pincode, city: store.city }),
    });
    check(edited.status === 200 && edited.body?.address?.fullAddress.includes("House 2"), "an address can be edited",
      edited.body?.address?.fullAddress);

    await go("/addresses");
    await page.waitForTimeout(900);
    const editBtn = await page.$$eval("button", (n) => n.some((b) => /edit/i.test(b.textContent)));
    check(editBtn, "the addresses page offers an Edit button");

    await api(`/api/addresses?id=${addrId}`, { method: "DELETE" });

    /* ---------- 7. account navigation ---------- */
    console.log("\n[7] Account navigation");
    for (const path of ["/profile", "/orders", "/addresses"]) {
      await go(path);
      await page.waitForTimeout(500);
      const back = await page.$$eval(".acct5__back, .acct5__brand", (n) => n.length);
      check(back > 0, `${path} has a way back to the store`);
    }

    /* ---------- 8. infinite scroll ---------- */
    console.log("\n[8] Infinite scroll");
    await go(`/store/${store.slug}/menu`);
    await page.waitForTimeout(1200);
    const before = await page.$$eval(".v5grid > *", (n) => n.length);
    if (before === 0) {
      check(false, "menu renders product cards");
    } else {
      const noLoadMore = await page.$$eval("button", (n) => !n.some((b) => /^load more$/i.test(b.textContent.trim())));
      check(noLoadMore, "the Load more button is gone");

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1400);
      const after = await page.$$eval(".v5grid > *", (n) => n.length);
      check(after > before || !(await page.$(".plp__more")), "scrolling reveals more cakes", `${before} -> ${after}`);
    }

    /* ---------- 9. reorder and cancel ---------- */
    console.log("\n[9] Reorder and cancel");
    {
      const product = await db.product.findFirst({
        where: { isAvailable: true, category: { storeId: store.id }, variants: { some: {} } },
        include: { variants: true },
      });
      const me = await api("/api/auth/profile");

      const mk = (status) => db.order.create({
        data: {
          orderNumber: `${TAG}-${status}`, userId: me.body.user.id, storeId: store.id,
          orderType: "PICKUP", itemTotal: 500, tax: 0, grandTotal: 500, status,
          items: {
            create: [{
              productId: product.id, productName: product.name, variantName: product.variants[0].name,
              quantity: 2, unitPrice: product.variants[0].price, totalPrice: product.variants[0].price * 2,
            }],
          },
        },
      });

      const pending = await mk("PENDING");
      const preparing = await mk("PREPARING");

      const re = await api(`/api/orders/${pending.id}/reorder`);
      check(re.status === 200 && re.body?.items?.length === 1, "reorder rebuilds the basket", `${re.body?.items?.length} item(s)`);
      check(re.body?.items?.[0]?.quantity === 2, "reorder keeps the original quantity", `qty ${re.body?.items?.[0]?.quantity}`);
      check(re.body?.items?.[0]?.unitPrice === product.variants[0].price, "reorder uses today's price");

      const cancelled = await api(`/api/orders/${pending.id}/cancel`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      check(cancelled.status === 200, "a pending order can be cancelled", `HTTP ${cancelled.status}`);
      const afterCancel = await db.order.findUnique({ where: { id: pending.id }, include: { statusHistory: true } });
      check(afterCancel.status === "CANCELLED", "the order really is cancelled", afterCancel.status);
      check(afterCancel.statusHistory.some((h) => h.status === "CANCELLED"), "cancellation is recorded in history");

      const tooLate = await api(`/api/orders/${preparing.id}/cancel`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      check(tooLate.status === 409, "an order already being prepared cannot be cancelled", `HTTP ${tooLate.status}`);

      // another customer's order must be invisible
      const other = await db.user.findFirst({ where: { id: { not: me.body.user.id } } });
      if (other) {
        const theirs = await db.order.create({
          data: {
            orderNumber: `${TAG}-OTHER`, userId: other.id, storeId: store.id,
            orderType: "PICKUP", itemTotal: 100, tax: 0, grandTotal: 100, status: "PENDING",
          },
        });
        const stolen = await api(`/api/orders/${theirs.id}/cancel`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
        });
        check(stolen.status === 404, "you cannot cancel someone else's order", `HTTP ${stolen.status}`);
        await db.order.delete({ where: { id: theirs.id } });
      }

      await go("/orders");
      await page.waitForTimeout(1200);
      const labels = await page.$$eval(".order5__ft button, .order5__ft a", (n) => n.map((x) => x.textContent.trim()));
      check(labels.some((t) => /reorder/i.test(t)), "order history offers Reorder", labels.join(" | "));

      await db.order.deleteMany({ where: { orderNumber: { startsWith: TAG } } });
    }

    /* ---------- 10. console ---------- */
    console.log("\n[10] Console");
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 110)));
    await go("/");
    await go(`/store/${store.slug}/menu`);
    await go("/profile");
    check(errors.length === 0, "zero page errors", errors.slice(0, 2).join(" ; "));

    await ctx.close();
  } finally {
    await db.order.deleteMany({ where: { orderNumber: { startsWith: TAG } } });
    await db.store.update({ where: { id: store.id }, data: backup });
    await db.address.deleteMany({ where: { fullAddress: { startsWith: TAG } } });
    if (extraStoreId) {
      await db.order.deleteMany({ where: { storeId: extraStoreId } });
      await db.store.delete({ where: { id: extraStoreId } }).catch(() => {});
    }
    await browser.close();
    await db.$disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n  ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("  FAILURES:");
    failed.forEach((f) => console.log(`   - ${f.n} ${f.d}`));
    process.exit(1);
  }
})();
