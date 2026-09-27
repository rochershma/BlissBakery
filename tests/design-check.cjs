// The anti-slop checklist from DESIGN.md, run as a gate rather than a vibe.
// Every rule here exists because the pre-redesign audit failed it.
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3005";
const PAGES = [
  ["home", "/"],
  ["menu", "/store/kuchaman-city/menu"],
  ["occasion", "/cakes/birthday"],
  ["search", "/search?q=cake"],
];

const results = [];
const check = (ok, n, d = "") => {
  results.push({ ok, n, d });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${n}${d ? " - " + d : ""}`);
};

const ALLOWED_SIZES = [11, 12, 13, 14, 15, 16, 17, 19, 22, 24, 28, 40, 60];

(async () => {
  const browser = await chromium.launch({ ignoreHTTPSErrors: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ignoreHTTPSErrors: true });
  const { hostname } = new URL(BASE);
  await ctx.addCookies([{ name: "bb-store", value: "kuchaman-city", domain: hostname, path: "/" }]);
  const page = await ctx.newPage();

  for (const [name, path] of PAGES) {
    console.log(`\n[${name}]`);
    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1600);

    const s = await page.evaluate((allowed) => {
      const els = [...document.querySelectorAll("body *")];
      const vis = els.filter((e) => e.getBoundingClientRect().width > 0);
      const stray = new Map();
      for (const e of vis) {
        if (!e.textContent?.trim() || e.children.length) continue;
        const fs = Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
        if (!allowed.includes(fs)) stray.set(fs, (stray.get(fs) || 0) + 1);
      }
      const sections = [...document.querySelectorAll("section")].map((n) => {
        const r = n.getBoundingClientRect();
        return `${Math.round(r.height)}|${n.className}|${n.querySelector(".rail") ? "rail" : ""}`;
      });
      const centred = [...document.querySelectorAll("h1,h2")].filter(
        (h) => getComputedStyle(h).textAlign === "center").length;
      return {
        pills: vis.filter((e) => getComputedStyle(e).borderRadius.startsWith("999")).length,
        gradients: vis.filter((e) => /gradient/.test(getComputedStyle(e).backgroundImage)).length,
        shadows: vis.filter((e) => getComputedStyle(e).boxShadow !== "none").length,
        stray: [...stray.entries()],
        dupSections: sections.length - new Set(sections).size,
        centred,
        fonts: [...new Set(vis.map((e) => getComputedStyle(e).fontFamily.split(",")[0].replace(/"/g, "")))]
          .filter((f) => !/nextjs/i.test(f)),
      };
    }, ALLOWED_SIZES);

    check(s.pills <= 12, `${name}: pills kept for toggles and stamps`, `${s.pills}`);
    check(s.gradients === 0, `${name}: no gradients`, `${s.gradients}`);
    check(s.shadows <= 3, `${name}: elevation used sparingly`, `${s.shadows}`);
    check(s.stray.length === 0, `${name}: only scale type sizes`, s.stray.map(([k, v]) => `${k}px×${v}`).join(" "));
    check(s.dupSections === 0, `${name}: no two sections share structure and height`, `${s.dupSections}`);
    check(s.centred === 0, `${name}: no centred headings`, `${s.centred}`);
    check(s.fonts.length <= 2, `${name}: two families only`, s.fonts.join(" + "));
  }

  // Food must out-weigh chrome where the customer is browsing.
  for (const [name, path] of [["home", "/"], ["menu", "/store/kuchaman-city/menu"]]) {
    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1600);
    const ratio = await page.evaluate(() => {
      const area = [...document.querySelectorAll("img")].reduce((a, i) => {
        const r = i.getBoundingClientRect();
        return a + r.width * r.height;
      }, 0);
      return area / (window.innerWidth * document.body.scrollHeight);
    });
    check(ratio > 0.2, `${name}: photography outweighs chrome`, ratio.toFixed(3));
  }

  await ctx.close();
  await browser.close();

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n  ${passed}/${results.length} checks passed`);
  if (passed !== results.length) {
    console.log("  FAILURES:");
    results.filter((r) => !r.ok).forEach((r) => console.log(`   - ${r.n} ${r.d}`));
    process.exitCode = 1;
  }
})();
