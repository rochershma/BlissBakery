// Store configuration suite: proves the values an admin sets (GST, charges,
// slots, add-on caps, stores) actually reach the storefront, and that the
// checkout total matches what the server will charge.
// Every store field it touches is restored at the end.
const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");
const { adminContext } = require("./_session.cjs");
const db = new PrismaClient();

const BASE = process.env.BASE || "http://localhost:3005";
const TAG = `cfg${Date.now().toString().slice(-6)}`;

const results = [];
const check = (ok, n, d = "") => {
  results.push({ ok, n, d });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${d ? " - " + d : ""}`);
};
const money = (t) => Number(String(t || "").replace(/[^\d.]/g, ""));

(async () => {
  const store = await db.store.findFirst();
  // snapshot so a failed run can't leave the shop misconfigured
  const backup = {
    gstRate: store.gstRate,
    deliverySlots: store.deliverySlots,
    addOnMaxQty: store.addOnMaxQty,
    orderLeadHours: store.orderLeadHours,
    packagingCharge: store.packagingCharge,
    deliveryCharge: store.deliveryCharge,
    minDeliveryOrder: store.minDeliveryOrder,
  };
  const createdStoreIds = [];

  const browser = await chromium.launch({ ignoreHTTPSErrors: true });
  const { ctx, page } = await adminContext(browser, BASE);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 110)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon/i.test(m.text())) errors.push(m.text().slice(0, 110)); });

  const go = (u) => page.goto(BASE + u, { waitUntil: "networkidle", timeout: 60000 });
  const api = (path, opts) => page.evaluate(async ([p, o]) => {
    const r = await fetch(p, o || undefined);
    let body = null; try { body = await r.json(); } catch {}
    return { status: r.status, body };
  }, [path, opts]);

  try {
    /* ---------- login ---------- */
    console.log("\n[1] Admin login");
    const me = await api("/api/auth/profile");
    check(me.body?.user?.role === "ADMIN", "admin session", me.body?.user?.role);

    /* ---------- configurable slots ---------- */
    console.log("\n[2] Delivery slots");
    const slots = [
      { label: `${TAG} Morning`, start: "00:00", end: "11:00", active: true },
      { label: `${TAG} Evening`, start: "23:00", end: "23:59", active: true },
      { label: `${TAG} Hidden`, start: "12:00", end: "13:00", active: false },
    ];
    await db.store.update({
      where: { id: store.id },
      data: { deliverySlots: JSON.stringify(slots), orderLeadHours: 0, addOnMaxQty: 3, gstRate: 0 },
    });

    const cfg = await api("/api/store/config");
    check(cfg.body?.deliverySlots?.length === 3, "slots exposed by store config", `${cfg.body?.deliverySlots?.length}`);
    check(cfg.body?.addOnMaxQty === 3, "add-on cap exposed", `${cfg.body?.addOnMaxQty}`);

    // seed a cart so checkout is reachable
    const product = await db.product.findFirst({
      where: { isAvailable: true, variants: { some: {} } },
      include: { variants: true },
    });
    const seedCart = async () => {
      const line = {
        productId: product.id,
        productSlug: product.slug,
        name: product.name,
        image: null,
        variantName: product.variants[0].name,
        unitPrice: product.variants[0].price,
        quantity: 1,
        addOns: [],
      };
      await page.evaluate((l) => {
        localStorage.setItem("bliss-bakery-cart", JSON.stringify({ state: { items: [l], storeSlug: "kuchaman-city" }, version: 0 }));
      }, line);
    };
    await seedCart();

    await go("/checkout");
    await page.waitForTimeout(1200);
    const slotChips = await page.$$eval(".slots .chip", (n) => n.map((x) => x.textContent.trim()));
    check(slotChips.some((s) => s.includes("Morning") || s.includes("Evening")), "configured slots render on checkout", slotChips.join(" | ") || "none");
    check(!slotChips.some((s) => s.includes("Hidden")), "inactive slot is not offered");

    // lead time must rule today out — and checkout should move the customer on
    // to the first date that still works rather than stranding them
    await db.store.update({ where: { id: store.id }, data: { orderLeadHours: 24 } });
    await go("/checkout");
    await page.waitForTimeout(1500);
    const picked = await page.evaluate(() => {
      const on = document.querySelector('.dpick__d[aria-pressed="true"]');
      const all = [...document.querySelectorAll(".dpick__d")];
      return { index: on ? all.indexOf(on) : -1, slots: document.querySelectorAll(".slots .chip").length };
    });
    check(picked.index > 0, "lead time moves the customer off today", `day index ${picked.index}`);
    check(picked.slots > 0, "and offers slots on that day instead", `${picked.slots} slots`);
    await db.store.update({ where: { id: store.id }, data: { orderLeadHours: 0 } });

    /* ---------- GST reaches the customer ---------- */
    console.log("\n[3] GST");
    await db.store.update({ where: { id: store.id }, data: { gstRate: 5, minDeliveryOrder: 0 } });
    await go("/checkout");
    await page.waitForTimeout(1400);

    const quoted = await page.evaluate(() => {
      const lines = [...document.querySelectorAll(".sline")].map((l) => l.textContent);
      return {
        gstLine: lines.find((t) => /GST/i.test(t)) || "",
        total: document.querySelector(".sline--tot b")?.textContent || "",
      };
    });
    check(/GST \(5%\)/.test(quoted.gstLine), "GST line shown when enabled", quoted.gstLine.trim());

    // the quoted total must equal what /api/orders/create would charge
    const placed = await api("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeSlug: "kuchaman-city",
        orderType: "DELIVERY",
        deliveryAddress: "Test address for config suite, Kuchaman City 341508",
        deliveryFee: (await api("/api/store/config")).body.deliveryCharge,
        items: [{
          productId: product.id,
          name: product.name,
          variantName: product.variants[0].name,
          quantity: 1,
          unitPrice: product.variants[0].price,
        }],
      }),
    });
    const charged = placed.body?.order?.grandTotal ?? placed.body?.grandTotal;
    check(Math.abs(money(quoted.total) - Number(charged)) < 1, "quoted total matches server charge",
      `quoted ${money(quoted.total)} vs charged ${charged}`);
    if (placed.body?.order?.id) await db.order.delete({ where: { id: placed.body.order.id } });

    await db.store.update({ where: { id: store.id }, data: { gstRate: 0 } });
    await go("/checkout");
    await page.waitForTimeout(1200);
    const noGst = await page.$$eval(".sline", (n) => n.some((l) => /GST/i.test(l.textContent)));
    check(!noGst, "GST line hidden when rate is 0");

    /* ---------- add-on cap ---------- */
    console.log("\n[4] Add-on cap");
    const addBtn = await page.$(".ao__add");
    if (!addBtn) {
      check(false, "add-on rail renders");
    } else {
      check(true, "add-on rail renders");
      await addBtn.click();
      const plus = page.locator('.ao__step button[aria-label^="Add one"]').first();
      for (let i = 0; i < 5; i++) { await plus.click({ force: true }).catch(() => {}); await page.waitForTimeout(120); }
      const qty = await page.locator(".ao__step b").first().textContent();
      check(Number(qty) === 3, "add-on quantity capped at the configured max", `qty ${qty} (cap 3)`);
      const plusDisabled = await plus.isDisabled();
      check(plusDisabled, "plus button disabled at the cap");

      const imgH = await page.$eval(".aocard__img", (n) => Math.round(n.getBoundingClientRect().height));
      check(imgH <= 72, "add-on thumbnails stay compact", `${imgH}px`);
    }

    /* ---------- minimum order ---------- */
    console.log("\n[5] Minimum order");
    await db.store.update({ where: { id: store.id }, data: { minDeliveryOrder: 999999 } });
    await go("/checkout");
    await page.waitForTimeout(1200);
    const minNote = await page.$(".co5__min");
    check(!!minNote, "minimum-order shortfall is shown");
    await db.store.update({ where: { id: store.id }, data: { minDeliveryOrder: backup.minDeliveryOrder } });

    /* ---------- store picker ---------- */
    console.log("\n[6] Store picker");
    await go("/");
    const loc = await page.$(".v5loc");
    check(!!loc, "store picker is present in the header");
    if (loc) {
      await loc.click();
      await page.waitForTimeout(900);
      const opts = await page.$$eval(".v5store__i", (n) => n.map((x) => x.textContent.trim()));
      check(opts.length > 0 && !opts[0].includes("Loading"), "store picker lists stores", opts.join(" | "));
    }

    /* ---------- store CRUD ---------- */
    console.log("\n[7] Store CRUD");
    let r = await go("/admin/stores");
    check(r.status() === 200, "admin stores page opens");

    await page.fill('input[name="name"]', `${TAG} Outlet`);
    await page.fill('input[name="city"]', "Testville");
    await page.fill('input[name="pincode"]', "123456");
    await page.getByRole("button", { name: /create store/i }).click();
    await page.waitForTimeout(2000);

    const madeStore = await db.store.findFirst({ where: { name: `${TAG} Outlet` } });
    check(!!madeStore, "store created via admin", madeStore?.slug);
    if (madeStore) createdStoreIds.push(madeStore.id);

    if (madeStore) {
      const list = await api("/api/stores");
      check(list.body?.stores?.some((s) => s.id === madeStore.id), "new store appears in the public picker");

      // closing a store must remove it from the customer-facing list
      await db.store.update({ where: { id: madeStore.id }, data: { isOpen: false } });
      const closed = await api("/api/stores");
      check(!closed.body?.stores?.some((s) => s.id === madeStore.id), "closed store is hidden from customers");
      await db.store.update({ where: { id: madeStore.id }, data: { isOpen: true } });

      // deleting a store that has orders must be refused
      const anyUser = await db.user.findFirst();
      const guardOrder = await db.order.create({
        data: {
          orderNumber: `${TAG}-guard`, userId: anyUser.id, storeId: madeStore.id,
          orderType: "PICKUP", itemTotal: 100, tax: 0, grandTotal: 100,
        },
      });
      await go("/admin/stores");
      await page.locator(`form button[aria-label="Delete ${TAG} Outlet"]`).click();
      await page.waitForTimeout(1800);
      const stillThere = await db.store.findUnique({ where: { id: madeStore.id } });
      check(!!stillThere, "store with orders is protected from deletion");
      check(/error=/.test(page.url()), "a reason is shown when deletion is refused");

      await db.order.delete({ where: { id: guardOrder.id } });
      await go("/admin/stores");
      await page.locator(`form button[aria-label="Delete ${TAG} Outlet"]`).click();
      await page.waitForTimeout(1800);
      const gone = await db.store.findUnique({ where: { id: madeStore.id } });
      check(!gone, "store without orders is deleted");
      if (!gone) createdStoreIds.length = 0;
    }

    /* ---------- add to cart: what next ---------- */
    console.log("\n[8] Add-to-cart follow-up");
    await page.evaluate(() => localStorage.removeItem("bliss-bakery-cart"));
    await go(`/store/kuchaman-city/menu/${product.slug}`);
    await page.waitForTimeout(800);
    await page.locator(".pdp5__cta").click();
    await page.waitForTimeout(900);
    const next = await page.$$eval(".pdp5__next button", (n) => n.map((x) => x.textContent.trim()));
    check(next.some((t) => /view cart/i.test(t)), "View cart offered after adding", next.join(" | "));
    check(next.some((t) => /continue shopping/i.test(t)), "Continue shopping offered after adding");

    await page.locator(".pdp5__next button", { hasText: /view cart/i }).first().click();
    await page.waitForTimeout(1500);
    check(/\/cart$/.test(page.url()), "View cart navigates to the cart", page.url());

    /* ---------- mobile layout ---------- */
    console.log("\n[9] Mobile layout");
    const mob = await ctx.newPage();
    await mob.setViewportSize({ width: 390, height: 844 });
    await mob.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
    await mob.evaluate((l) => {
      localStorage.setItem("bliss-bakery-cart", JSON.stringify({ state: { items: [l], storeSlug: "kuchaman-city" }, version: 0 }));
    }, {
      productId: product.id, productSlug: product.slug, name: product.name, image: null,
      variantName: product.variants[0].name, unitPrice: product.variants[0].price, quantity: 1, addOns: [],
    });
    await mob.goto(BASE + "/checkout", { waitUntil: "networkidle", timeout: 60000 });
    await mob.waitForTimeout(1500);

    const m = await mob.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      cards: document.querySelectorAll(".aocard").length,
      slots: document.querySelectorAll(".slots .chip").length,
      thumb: document.querySelector(".aocard__img")?.getBoundingClientRect().height ?? 0,
    }));
    check(m.overflow <= 1, "checkout has no horizontal overflow on mobile", `${m.overflow}px`);
    check(m.slots > 0, "slot chips render on mobile", `${m.slots}`);
    check(m.cards > 0 && m.thumb <= 72, "add-on cards stay compact on mobile", `${m.cards} cards, ${Math.round(m.thumb)}px thumb`);

    // the full-catalogue sheet must be reachable and dismissable on a phone
    const seeAll = await mob.$(".ao__all");
    if (seeAll) {
      await seeAll.click();
      await mob.waitForTimeout(600);
      const sheet = await mob.evaluate(() => {
        const p = document.querySelector(".aosheet__panel");
        if (!p) return null;
        const r = p.getBoundingClientRect();
        return { withinViewport: r.bottom <= window.innerHeight + 1, rows: document.querySelectorAll(".aorow").length };
      });
      check(!!sheet && sheet.withinViewport, "add-on sheet fits the phone viewport");
      check(!!sheet && sheet.rows > 0, "add-on sheet lists every add-on", `${sheet?.rows} rows`);
      await mob.keyboard.press("Escape");
      await mob.waitForTimeout(400);
      check(!(await mob.$(".aosheet__panel")), "Escape closes the add-on sheet");
    }
    await mob.close();

    /* ---------- no console errors ---------- */
    console.log("\n[10] Console");
    check(errors.length === 0, "zero console errors", errors.slice(0, 2).join(" ; "));
  } finally {
    await db.store.update({ where: { id: store.id }, data: backup });
    for (const id of createdStoreIds) {
      await db.order.deleteMany({ where: { storeId: id } });
      await db.store.delete({ where: { id } }).catch(() => {});
    }
    await db.order.deleteMany({ where: { orderNumber: { startsWith: TAG } } });
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
