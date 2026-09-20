// Order-flow suite: proves an order stays inside the outlet the customer chose,
// that the server — not the browser — decides reachability and delivery fee,
// and that order history says where the cake is going or being collected.
const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");
const { adminContext } = require("./_session.cjs");
const db = new PrismaClient();

const BASE = process.env.BASE || "http://localhost:3005";
const TAG = `of${Date.now().toString().slice(-6)}`;

const results = [];
const check = (ok, n, d = "") => {
  results.push({ ok, n, d });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${d ? " - " + d : ""}`);
};

(async () => {
  const home = await db.store.findFirst({ where: { slug: "kuchaman-city" } });
  const backup = {
    latitude: home.latitude, longitude: home.longitude, deliveryRadius: home.deliveryRadius,
    deliveryTiers: home.deliveryTiers, minDeliveryOrder: home.minDeliveryOrder,
    servicePincodes: home.servicePincodes, deliveryCharge: home.deliveryCharge,
  };

  const browser = await chromium.launch({ ignoreHTTPSErrors: true });
  const { ctx, page } = await adminContext(browser, BASE);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 120)));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    // This suite deliberately provokes rejections; only unexpected noise counts.
    if (/favicon/i.test(m.text())) return;
    if (/status of (400|401)/.test(m.text())) return;
    errors.push(m.text().slice(0, 120));
  });

  const go = (u) => page.goto(BASE + u, { waitUntil: "networkidle", timeout: 60000 });
  const api = (path, opts) => page.evaluate(async ([p, o]) => {
    const r = await fetch(p, o || undefined);
    let body = null; try { body = await r.json(); } catch {}
    return { status: r.status, body };
  }, [path, opts]);
  const post = (path, payload) =>
    api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

  const made = { storeId: null, addressIds: [], orderIds: [] };

  try {
    const user = await db.user.findFirst({ where: { phone: "9602831559" } });
    const product = await db.product.findFirst({
      where: { isAvailable: true, category: { storeId: home.id }, variants: { some: {} } },
      include: { variants: true },
    });

    /* ---------- 1. a basket cannot cross outlets ---------- */
    console.log("\n[1] Cross-outlet basket");
    const other = await db.store.create({
      data: {
        name: `${TAG} Outlet`, slug: `${TAG}-outlet`, address: "Far Road", city: "Faraway",
        state: "Rajasthan", pincode: "999999", phone: "9000000000",
        latitude: 20.0, longitude: 80.0, deliveryRadius: 5,
      },
    });
    made.storeId = other.id;
    const otherCat = await db.category.create({
      data: { name: `${TAG} Cakes`, slug: `${TAG}-cakes`, storeId: other.id },
    });
    const otherProduct = await db.product.create({
      data: {
        name: `${TAG} Far Cake`, slug: `${TAG}-far-cake`, description: "x", basePrice: 500,
        images: "[]", categoryId: otherCat.id,
      },
    });

    const localAddress = await db.address.create({
      data: {
        userId: user.id, label: "Suite", houseNo: "1", fullAddress: `${TAG} test address`,
        city: "Kuchaman City", pincode: home.pincode,
      },
    });
    made.addressIds.push(localAddress.id);

    const crossed = await post("/api/orders/create", {
      storeSlug: "kuchaman-city",
      orderType: "DELIVERY",
      addressId: localAddress.id,
      items: [{ productId: otherProduct.id, name: otherProduct.name, quantity: 1, unitPrice: 500 }],
    });
    check(crossed.status === 400, "an item from another outlet is refused", `${crossed.status} ${crossed.body?.message ?? ""}`);
    check(/isn't sold at/i.test(crossed.body?.message ?? ""), "and the refusal names the outlet", crossed.body?.message);

    /* ---------- 2. the browser cannot set the delivery fee ---------- */
    console.log("\n[2] Delivery fee is server-side");
    await db.store.update({
      where: { id: home.id },
      data: { latitude: null, longitude: null, deliveryCharge: 40, minDeliveryOrder: 0, servicePincodes: null },
    });
    const freeAttempt = await post("/api/orders/create", {
      storeSlug: "kuchaman-city",
      orderType: "DELIVERY",
      addressId: localAddress.id,
      deliveryFee: 0,
      items: [{ productId: product.id, name: product.name, variantName: product.variants[0].name, quantity: 1, unitPrice: 1 }],
    });
    const feeOrder = freeAttempt.body?.order?.id ? await db.order.findUnique({ where: { id: freeAttempt.body.order.id } }) : null;
    if (feeOrder) made.orderIds.push(feeOrder.id);
    check(feeOrder?.deliveryCharge === 40, "a zero fee sent by the browser is ignored", `charged ${feeOrder?.deliveryCharge}`);
    check(feeOrder?.itemTotal > 1, "and the item price comes from the database", `${feeOrder?.itemTotal}`);

    /* ---------- 3. reachability by pincode ---------- */
    console.log("\n[3] Pincode service area");
    await db.store.update({ where: { id: home.id }, data: { servicePincodes: "111111" } });
    const farAddress = await db.address.create({
      data: {
        userId: user.id, label: "Far", houseNo: "9", fullAddress: `${TAG} far address`,
        city: "Nowhere", pincode: "222222",
      },
    });
    made.addressIds.push(farAddress.id);

    const outside = await post("/api/orders/create", {
      storeSlug: "kuchaman-city",
      orderType: "DELIVERY",
      addressId: farAddress.id,
      items: [{ productId: product.id, name: product.name, variantName: product.variants[0].name, quantity: 1, unitPrice: 1 }],
    });
    check(outside.status === 400, "an unserved pincode is refused", `${outside.status}`);
    check(/doesn't deliver to 222222/i.test(outside.body?.message ?? ""), "and says which pincode", outside.body?.message);

    const verdictFar = await api(`/api/delivery/check?addressId=${farAddress.id}`);
    check(verdictFar.body?.deliverable === false, "the checkout check agrees it is unreachable");

    /* ---------- 4. reachability by distance ---------- */
    console.log("\n[4] Distance and tiers");
    await db.store.update({
      where: { id: home.id },
      data: {
        latitude: 27.1517, longitude: 74.856, deliveryRadius: 10, servicePincodes: null,
        deliveryTiers: JSON.stringify([{ maxKm: 3, fee: 0 }, { maxKm: 10, fee: 60 }]),
      },
    });
    const near = await db.address.update({
      where: { id: localAddress.id },
      data: { latitude: 27.1525, longitude: 74.857 },
    });
    const nearCheck = await api(`/api/delivery/check?addressId=${near.id}`);
    check(nearCheck.body?.deliverable === true && nearCheck.body?.fee === 0,
      "an address inside the free tier costs nothing", `fee ${nearCheck.body?.fee}, ${nearCheck.body?.distanceKm?.toFixed?.(2)} km`);

    await db.address.update({ where: { id: near.id }, data: { latitude: 27.21, longitude: 74.9 } });
    const midCheck = await api(`/api/delivery/check?addressId=${near.id}`);
    check(midCheck.body?.fee === 60, "a farther address falls into the paid tier", `fee ${midCheck.body?.fee}`);

    await db.address.update({ where: { id: near.id }, data: { latitude: 28.9, longitude: 76.5 } });
    const tooFar = await api(`/api/delivery/check?addressId=${near.id}`);
    check(tooFar.body?.deliverable === false, "beyond the radius is refused", tooFar.body?.reason);

    const beyond = await post("/api/orders/create", {
      storeSlug: "kuchaman-city", orderType: "DELIVERY", addressId: near.id,
      items: [{ productId: product.id, name: product.name, variantName: product.variants[0].name, quantity: 1, unitPrice: 1 }],
    });
    check(beyond.status === 400, "and an order to it is refused too", `${beyond.status}`);

    /* ---------- 5. minimum order is enforced server-side ---------- */
    console.log("\n[5] Minimum order");
    await db.address.update({ where: { id: near.id }, data: { latitude: 27.1525, longitude: 74.857 } });
    await db.store.update({ where: { id: home.id }, data: { minDeliveryOrder: 999999 } });
    const tooSmall = await post("/api/orders/create", {
      storeSlug: "kuchaman-city", orderType: "DELIVERY", addressId: near.id,
      items: [{ productId: product.id, name: product.name, variantName: product.variants[0].name, quantity: 1, unitPrice: 1 }],
    });
    check(tooSmall.status === 400 && /start at/i.test(tooSmall.body?.message ?? ""),
      "an order below the minimum is refused", tooSmall.body?.message);
    await db.store.update({ where: { id: home.id }, data: { minDeliveryOrder: 0 } });

    /* ---------- 6. the address is snapshotted onto the order ---------- */
    console.log("\n[6] Address on the order");
    const placed = await post("/api/orders/create", {
      storeSlug: "kuchaman-city", orderType: "DELIVERY", addressId: near.id,
      items: [{ productId: product.id, name: product.name, variantName: product.variants[0].name, quantity: 1, unitPrice: 1 }],
    });
    const row = placed.body?.order?.id ? await db.order.findUnique({ where: { id: placed.body.order.id } }) : null;
    if (row) made.orderIds.push(row.id);
    check(Boolean(row?.deliveryAddress?.includes(`${TAG} test address`)),
      "the delivery address is stored on the order", row?.deliveryAddress);

    // deleting the saved address must not erase where the order went
    const throwaway = await db.address.create({
      data: { userId: user.id, label: "Temp", houseNo: "2", fullAddress: `${TAG} temp`, city: "Kuchaman City", pincode: home.pincode, latitude: 27.1525, longitude: 74.857 },
    });
    const withTemp = await post("/api/orders/create", {
      storeSlug: "kuchaman-city", orderType: "DELIVERY", addressId: throwaway.id,
      items: [{ productId: product.id, name: product.name, variantName: product.variants[0].name, quantity: 1, unitPrice: 1 }],
    });
    if (withTemp.body?.order?.id) made.orderIds.push(withTemp.body.order.id);
    await db.address.delete({ where: { id: throwaway.id } });
    const kept = withTemp.body?.order?.id ? await db.order.findUnique({ where: { id: withTemp.body.order.id } }) : null;
    check(Boolean(kept?.deliveryAddress?.includes(`${TAG} temp`)),
      "and survives the address being deleted", kept?.deliveryAddress);

    /* ---------- 7. pickup names the outlet ---------- */
    console.log("\n[7] Pickup");
    const pickup = await post("/api/orders/create", {
      storeSlug: "kuchaman-city", orderType: "PICKUP",
      items: [{ productId: product.id, name: product.name, variantName: product.variants[0].name, quantity: 1, unitPrice: 1 }],
    });
    const pickupRow = pickup.body?.order?.id ? await db.order.findUnique({ where: { id: pickup.body.order.id } }) : null;
    if (pickupRow) made.orderIds.push(pickupRow.id);
    check(pickupRow?.deliveryCharge === 0, "pickup is never charged delivery", `${pickupRow?.deliveryCharge}`);
    check(pickupRow?.deliveryAddress === null, "pickup stores no delivery address");

    const list = await api("/api/orders");
    const listed = list.body?.orders?.find((o) => o.id === pickupRow?.id);
    check(Boolean(listed?.storeAddress), "order history exposes the pickup outlet address", listed?.storeAddress);
    const listedDelivery = list.body?.orders?.find((o) => o.id === row?.id);
    check(Boolean(listedDelivery?.deliveryAddress), "and the delivery address for delivery orders");

    await go("/orders");
    await page.waitForTimeout(1500);
    const shown = await page.$$eval(".order5__where", (n) => n.map((x) => x.innerText.replace(/\s+/g, " ").trim()));
    check(shown.some((t) => /Pick up from/i.test(t)), "the orders page says where to collect", shown[0] ?? "none");
    check(shown.some((t) => /Delivering to/i.test(t)), "and where deliveries are going");

    await go(`/order/${pickupRow.id}`);
    await page.waitForTimeout(1200);
    const detail = await page.evaluate(() => document.body.innerText);
    check(/Pick up from/i.test(detail), "the tracker names the pickup outlet");

    /* ---------- 8. switching outlet warns before emptying the basket ---------- */
    console.log("\n[8] Switching outlet");
    await go("/");
    await page.evaluate((l) => {
      localStorage.setItem("bliss-bakery-cart", JSON.stringify({ state: { items: [l], storeSlug: "kuchaman-city" }, version: 0 }));
    }, { productId: "x", name: "Seed", unitPrice: 100, quantity: 2, addOns: [] });
    await go("/");
    await page.waitForTimeout(800);

    await page.locator(".v5loc").first().click();
    await page.waitForTimeout(600);
    await page.locator(".v5store__i").filter({ hasText: `${TAG} Outlet` }).first().click();
    await page.waitForTimeout(600);
    const dialog = await page.$(".v5swap");
    check(!!dialog, "a confirmation appears before the basket is emptied");
    if (dialog) {
      const copy = await page.$eval(".v5swap", (n) => n.innerText.replace(/\s+/g, " "));
      check(/2 items/.test(copy), "it says how much is in the basket", copy.slice(0, 90));

      await page.getByRole("button", { name: /stay at/i }).click();
      await page.waitForTimeout(500);
      const kept2 = await page.evaluate(() => JSON.parse(localStorage.getItem("bliss-bakery-cart")).state.items.length);
      check(kept2 === 1, "declining keeps the basket", `${kept2} lines`);

      await page.locator(".v5loc").first().click();
      await page.waitForTimeout(500);
      await page.locator(".v5store__i").filter({ hasText: `${TAG} Outlet` }).first().click();
      await page.waitForTimeout(500);
      await page.getByRole("button", { name: /switch/i }).click();
      await page.waitForTimeout(2500);

      const after = await page.evaluate(() => ({
        items: JSON.parse(localStorage.getItem("bliss-bakery-cart")).state.items.length,
        slug: JSON.parse(localStorage.getItem("bliss-bakery-cart")).state.storeSlug,
        outlet: document.querySelector(".v5loc b")?.textContent?.trim(),
      }));
      check(after.items === 0, "accepting empties the basket", `${after.items} lines`);
      check(after.slug === `${TAG}-outlet`, "and the basket follows the new outlet", after.slug);
      check(after.outlet === "Faraway", "the header shows the new outlet", after.outlet);
      check(!/\/store\/kuchaman-city/.test(page.url()), "and we are no longer on the old outlet's pages", page.url());

      const cfg = await api("/api/store/config");
      check(cfg.body?.slug === `${TAG}-outlet`, "the server agrees after a refresh", cfg.body?.slug);
    }

    /* ---------- 9. places proxy keeps the key server-side ---------- */
    console.log("\n[9] Address search");
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    const anonCall = await anonPage.evaluate(async () => {
      const r = await fetch("/api/places/autocomplete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "kuchaman" }),
      });
      return r.status;
    });
    check(anonCall === 401, "address search requires a signed-in customer", `${anonCall}`);
    await anon.close();

    const html = await page.content();
    check(!/AIza/.test(html), "the maps key is never sent to the browser");

    const short = await post("/api/places/autocomplete", { input: "ku" });
    check(Array.isArray(short.body?.suggestions) && short.body.suggestions.length === 0,
      "a too-short query costs nothing");

    /* ---------- 10. no console noise ---------- */
    console.log("\n[10] Console");
    check(errors.length === 0, "zero page errors", errors.slice(0, 2).join(" | "));
  } catch (e) {
    check(false, "suite completed", e.message.slice(0, 160));
  } finally {
    // put the shop back exactly as we found it
    await db.store.update({ where: { id: home.id }, data: backup }).catch(() => {});
    for (const id of made.orderIds) await db.order.delete({ where: { id } }).catch(() => {});
    for (const id of made.addressIds) await db.address.delete({ where: { id } }).catch(() => {});
    if (made.storeId) await db.store.delete({ where: { id: made.storeId } }).catch(() => {});
    await ctx.close();
    await browser.close();
    await db.$disconnect();

    const passed = results.filter((r) => r.ok).length;
    console.log(`\n  ${passed}/${results.length} passed`);
    if (passed !== results.length) {
      console.log("  FAILURES:");
      results.filter((r) => !r.ok).forEach((r) => console.log(`   - ${r.n} ${r.d}`));
      process.exitCode = 1;
    }
  }
})();
