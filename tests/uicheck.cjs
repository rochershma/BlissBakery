const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:3005";

const ROUTES = [
  "/", "/search?q=cake", "/offers", "/about", "/contact",
  "/store/kuchaman-city/menu", "/store/kuchaman-city/custom-cakes",
  "/cakes/birthday", "/themes/kids-cakes", "/cart", "/checkout",
  "/orders", "/addresses", "/profile", "/privacy", "/terms", "/refund-policy",
];

const VIEWPORTS = [
  { name: "phone-360", width: 360, height: 740, isMobile: true },
  { name: "phone-390", width: 390, height: 844, isMobile: true },
  { name: "phone-430", width: 430, height: 932, isMobile: true },
  { name: "tablet-768", width: 768, height: 1024, isMobile: true },
  { name: "laptop-1024", width: 1024, height: 768, isMobile: false },
  { name: "desktop-1440", width: 1440, height: 900, isMobile: false },
  { name: "wide-1920", width: 1920, height: 1080, isMobile: false },
];

(async () => {
  const browser = await chromium.launch();
  let fails = 0, checks = 0;

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });
    console.log(`\n=== ${vp.name} ${vp.width}x${vp.height} ===`);

    for (const route of ROUTES) {
      const page = await ctx.newPage();
      const errors = [];
      page.on("console", (m) => {
        const t = m.text();
        if (m.type() === "error" || /same key|height value of 0|does not implement width|hydrat/i.test(t)) {
          if (!/favicon|Download the React DevTools|ChunkLoadError/i.test(t)) errors.push(t.slice(0, 95));
        }
      });
      page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message.slice(0, 95)));

      let status = 0;
      try {
        const r = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
        status = r.status();
        await page.waitForTimeout(700);
      } catch (e) {
        errors.push("NAV " + e.message.slice(0, 60));
      }

      const probe = await page.evaluate(() => {
        const out = { overflow: 0, unstyled: false, squashed: [], zeroImgs: 0, hugeSvg: 0, cssRules: 0, wide: [], counts: [] };
        const vw = window.innerWidth;
        out.overflow = Math.max(0, document.documentElement.scrollWidth - vw);
        out.cssRules = [...document.styleSheets].reduce((n, s) => { try { return n + s.cssRules.length; } catch { return n; } }, 0);
        const hdr = document.querySelector(".v5hdr");
        // A styled header is sticky; an unstyled one is not.
        out.unstyled = !!hdr && getComputedStyle(hdr).position !== "sticky";

        // overflow:hidden on body hides document-level overflow, so measure elements directly
        const isClipped = (n) => {
          for (let p = n.parentElement; p; p = p.parentElement) {
            const ox = getComputedStyle(p).overflowX;
            if (ox === "hidden" || ox === "auto" || ox === "scroll") return true;
          }
          return false;
        };
        document.querySelectorAll("body *").forEach((n) => {
          const r = n.getBoundingClientRect();
          if (r.width > vw + 2 && getComputedStyle(n).overflowX === "visible"
              && n.offsetParent !== null && !isClipped(n)) {
            out.wide.push(`${n.tagName}.${(n.className || "").toString().slice(0, 24)}=${Math.round(r.width)}`);
          }
        });

        document.querySelectorAll("a, span, button").forEach((e) => {
          if (getComputedStyle(e).whiteSpace === "nowrap" && e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 6)
            out.squashed.push(e.textContent.trim().slice(0, 18));
        });
        document.querySelectorAll("img").forEach((i) => {
          const r = i.getBoundingClientRect();
          // offsetParent is null for display:none subtrees — not a broken image
          if (i.getAttribute("src") && i.offsetParent !== null && (r.height === 0 || r.width === 0)) out.zeroImgs++;
        });
        document.querySelectorAll("svg").forEach((s) => {
          if (s.getBoundingClientRect().width > 140) out.hugeSvg++;
        });

        // catalogue counts must never be shown to customers ("787 cakes", "12 items").
        // Matched only as a whole label so product names like "Ben 10 Cakes" don't trip it.
        const counts = [];
        document.querySelectorAll("body *").forEach((n) => {
          if (n.children.length) return;
          const t = (n.textContent || "").trim();
          if (/^\d{2,}\s+(cakes?|products?|designs?|items?|results?)$/i.test(t)
            || /^(showing|found)\s+\d+/i.test(t)) counts.push(t.slice(0, 24));
        });
        out.counts = [...new Set(counts)].slice(0, 3);
        return out;
      }).catch(() => null);

      checks++;
      const issues = [];
      if (status !== 200) issues.push(`status=${status}`);
      if (probe) {
        if (probe.cssRules < 300) issues.push(`CSS-MISSING(${probe.cssRules} rules)`);
        if (probe.unstyled) issues.push("HEADER-UNSTYLED");
        if (probe.overflow > 2) issues.push(`overflow=${probe.overflow}px`);
        if (probe.wide.length) issues.push(`WIDER-THAN-VIEWPORT=[${probe.wide.slice(0, 2).join("|")}]`);
        if (probe.squashed.length) issues.push(`squashed=[${probe.squashed.slice(0, 3).join("|")}]`);
        if (probe.zeroImgs) issues.push(`zeroSizeImgs=${probe.zeroImgs}`);
        if (probe.hugeSvg) issues.push(`hugeSvg=${probe.hugeSvg}`);
        if (probe.counts.length) issues.push(`CATALOGUE-COUNT=[${probe.counts.join("|")}]`);
      }
      if (errors.length) issues.push(`console: ${errors[0]}`);

      if (issues.length) { fails++; console.log(`  FAIL ${route.padEnd(34)} ${issues.join("  ")}`); }
      else console.log(`  ok   ${route}`);
      await page.close();
    }
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${checks - fails}/${checks} routes clean`);
  process.exit(fails ? 1 : 0);
})();
