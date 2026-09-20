// Reproduces the specific bugs reported, so fixes can be verified against evidence.
const { chromium } = require("playwright");
const { adminContext } = require("./_session.cjs");
const BASE = process.env.BASE || "http://localhost:3005";

const out = [];
const note = (area, status, detail = "") => {
  out.push({ area, status, detail });
  console.log(`  ${status.padEnd(7)} ${area}${detail ? " :: " + detail : ""}`);
};

(async () => {
  const browser = await chromium.launch({ ignoreHTTPSErrors: true });
  const { ctx, page } = await adminContext(browser, BASE, { viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 100)));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon/i.test(m.text())) errors.push(m.text().slice(0, 100)); });

  const go = (u) => page.goto(BASE + u, { waitUntil: "networkidle", timeout: 60000 });

  /* ---------- marquee ---------- */
  console.log("\n[1] Top strip / marquee");
  await go("/");
  const anim = await page.evaluate(() => {
    const hits = [];
    document.querySelectorAll("body *").forEach((e) => {
      const c = getComputedStyle(e);
      if (c.animationName !== "none" && c.animationIterationCount === "infinite")
        hits.push(`${e.tagName}.${(e.className || "").toString().slice(0, 24)} ${c.animationName}`);
    });
    return [...new Set(hits)];
  });
  note("infinite animations on home", anim.length ? "BUG" : "ok", anim.join(" | "));

  const ticker = await page.evaluate(() => {
    const t = document.querySelector(".ticker");
    if (!t) return null;
    return { h: Math.round(t.getBoundingClientRect().height), text: t.innerText.replace(/\s+/g, " ").slice(0, 60) };
  });
  note("ticker present", ticker ? "INFO" : "ok", ticker ? `${ticker.h}px "${ticker.text}"` : "absent");

  /* ---------- login ---------- */
  console.log("\n[2] Login");
  try {
    const me = await page.evaluate(() => fetch("/api/auth/profile").then((r) => r.json()).catch(() => null));
    note("login", me?.user?.id ? "ok" : "BUG", me?.user?.phone || "no session");
  } catch (e) { note("login", "BUG", e.message.slice(0, 70)); }

  /* ---------- addresses ---------- */
  console.log("\n[3] Addresses");
  await go("/addresses");
  const addrUi = await page.evaluate(() => ({
    addBtn: [...document.querySelectorAll("button,a")].filter((b) => /add|new/i.test(b.textContent)).length,
    rows: document.querySelectorAll(".addr5__row, .addr5 li, [class*=addr]").length,
    deleteBtns: [...document.querySelectorAll("button")].filter((b) => /delete|remove/i.test(b.textContent)).length,
  }));
  note("addresses page controls", addrUi.addBtn ? "ok" : "BUG", JSON.stringify(addrUi));

  // create via API to isolate UI from API
  // unique per run so repeated runs can't shadow each other
  const LABEL = `BugTest-${Date.now().toString().slice(-6)}`;
  const created = await page.evaluate(async (label) => {
    const r = await fetch("/api/addresses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, fullAddress: "1 Test Street", landmark: "near nothing", pincode: "341508", city: "Kuchaman City", state: "Rajasthan" }),
    });
    return { status: r.status, body: await r.json().catch(() => null) };
  }, LABEL);
  note("address create API", created.status < 300 ? "ok" : "BUG", `status ${created.status}`);

  const listed = await page.evaluate(() => fetch("/api/addresses").then((r) => r.json()).catch(() => null));
  const mine = (listed?.addresses || []).find((a) => a.label === LABEL);
  note("address appears in list", mine ? "ok" : "BUG", `${(listed?.addresses || []).length} total`);

  if (mine) {
    const del = await page.evaluate(async (id) => {
      const r = await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
      return { status: r.status, body: await r.text().then((t) => t.slice(0, 80)) };
    }, mine.id);
    note("address delete API", del.status < 300 ? "ok" : "BUG", `status ${del.status} ${del.body}`);
    const after = await page.evaluate(() => fetch("/api/addresses").then((r) => r.json()).catch(() => null));
    const still = (after?.addresses || []).some((a) => a.id === mine.id);
    note("address actually removed", still ? "BUG" : "ok", still ? "still present" : "gone");

    // tidy up anything earlier runs left behind
    const strays = (after?.addresses || []).filter((a) => /^BugTest/.test(a.label || ""));
    for (const s of strays) {
      await page.evaluate((id) => fetch(`/api/addresses?id=${id}`, { method: "DELETE" }), s.id);
    }
    if (strays.length) note("cleaned stray test addresses", "INFO", `${strays.length} removed`);
  }

  /* ---------- track order ---------- */
  console.log("\n[4] Track order");
  const tnav = await go("/track");
  note("track route resolves", tnav.status() === 200 ? "ok" : "BUG", `status ${tnav.status()} -> ${page.url().replace(BASE, "")}`);
  const tr = await page.evaluate(() => ({
    timeline: document.querySelectorAll(".tl5").length,
    status: document.querySelector(".status")?.textContent?.trim() || null,
    total: document.querySelector(".sline--tot b")?.textContent || null,
    items: document.querySelectorAll(".co5__item").length,
  }));
  note("timeline renders", tr.timeline > 0 ? "ok" : "BUG", `${tr.timeline} steps, status=${tr.status}`);
  note("order items render", tr.items > 0 ? "ok" : "BUG", `${tr.items} items, total=${tr.total}`);

  // per-order button from the history list
  await go("/orders");
  await page.waitForTimeout(1200);
  const perOrder = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a")].find((x) => /track order/i.test(x.textContent));
    return a ? a.getAttribute("href") : null;
  });
  note("per-order track link", perOrder ? "ok" : "BUG", perOrder || "none");

  /* ---------- logout ---------- */
  console.log("\n[5] Logout");
  await go("/profile");
  const logoutBtn = await page.evaluate(() =>
    [...document.querySelectorAll("button,a")].some((b) => /log ?out|sign ?out/i.test(b.textContent)));
  note("logout control present", logoutBtn ? "ok" : "BUG");
  if (logoutBtn) {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button,a")].find((x) => /log ?out|sign ?out/i.test(x.textContent));
      b && b.click();
    });
    await page.waitForTimeout(3000);
    const url = page.url().replace(BASE, "") || "/";
    const stillIn = await page.evaluate(() => fetch("/api/auth/profile").then((r) => r.json()).then((d) => !!d?.user).catch(() => false));
    note("logout clears session", stillIn ? "BUG" : "ok");
    note("logout redirects home", url === "/" || url === "" ? "ok" : "BUG", `landed on ${url}`);
  }

  /* ---------- store selector ---------- */
  console.log("\n[6] Store selector");
  await go("/");
  const storeUi = await page.evaluate(() => ({
    locPill: !!document.querySelector(".v5loc"),
    locText: document.querySelector(".v5loc")?.innerText?.replace(/\s+/g, " ") || null,
    clickable: document.querySelector(".v5loc")?.tagName || null,
  }));
  note("store/location selector", storeUi.locPill ? "INFO" : "BUG", JSON.stringify(storeUi));

  const stores = await page.evaluate(() => fetch("/api/store/config").then((r) => r.json()).catch(() => null));
  note("store config API", stores ? "ok" : "BUG", stores ? Object.keys(stores).join(",").slice(0, 90) : "");

  console.log("\n[7] Console errors");
  note("zero page errors", errors.length ? "BUG" : "ok", errors[0] || "");

  const bugs = out.filter((o) => o.status === "BUG");
  console.log("\n" + "=".repeat(60));
  console.log(`  ${bugs.length} bug(s) reproduced out of ${out.length} checks`);
  bugs.forEach((b) => console.log(`   - ${b.area}${b.detail ? " :: " + b.detail : ""}`));
  console.log("=".repeat(60));
  await browser.close();
})();
