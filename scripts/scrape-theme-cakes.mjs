/**
 * Bakingo Theme Cake Scraper
 * 
 * Uses Playwright to render Bakingo pages and extract ONLY product photos (3-4 angles).
 * Uploads to Cloudinary CDN, saves product data to JSON.
 * 
 * Usage: 
 *   $env:CLOUDINARY_API_SECRET = "your_secret"
 *   node scripts/scrape-theme-cakes.mjs [kids|grownup|all] [limit]
 */

import { chromium } from "playwright";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { v2 as cloudinary } from "cloudinary";

const BASE_DIR = "Q:/src/poc/bakes/Theme Cakes/Theme Cakes";
const OUTPUT_FILE = "scripts/scraped-products.json";

cloudinary.config({
  cloud_name: "dvw9o0f8z",
  api_key: "792441267859941",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const THEMES = {
  kids: { folder: "Kids Cakes", themeSlug: "kids-cakes" },
  grownup: { folder: "Grown Up Cakes", themeSlug: "grown-up-cakes" },
};

async function scrapeProduct(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(4000);
    return await page.evaluate((pageUrl) => {
      const name = document.querySelector("h1")?.textContent?.trim() || "";
      const desc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
      const slugMatch = pageUrl.match(/(?:them|theme|cake|phot)\d+/i);
      const pat = slugMatch?.[0]?.toLowerCase() || "";
      const imgs = [];
      document.querySelectorAll("img").forEach(img => {
        const src = (img.src || img.dataset?.src || "").replace(/\?.*$/, "");
        if (!src.includes("bkmedia.bakingo.com") || src.includes("ssr-static") || src.includes("sprite") || src.includes("fav_")) return;
        if (pat && src.split("/").pop().toLowerCase().includes(pat)) imgs.push(src);
      });
      return { name, description: desc.slice(0, 500), images: [...new Set(imgs)].slice(0, 4) };
    }, url);
  } catch { return null; }
}

async function uploadToCloudinary(imageUrl, folder) {
  try {
    const r = await cloudinary.uploader.upload(imageUrl, { folder: `blissbakery/themes/${folder}`, quality: "auto:best", format: "jpg" });
    return r.secure_url;
  } catch (e) { console.error(`    CDN fail: ${e.message?.slice(0, 60)}`); return null; }
}

async function main() {
  if (!process.env.CLOUDINARY_API_SECRET) { console.error("Set CLOUDINARY_API_SECRET!"); process.exit(1); }
  const mode = process.argv[2] || "all";
  const limit = parseInt(process.argv[3] || "999");
  let allProducts = existsSync(OUTPUT_FILE) ? JSON.parse(readFileSync(OUTPUT_FILE, "utf-8")) : [];
  console.log(`Resume: ${allProducts.length} already done`);
  const doneUrls = new Set(allProducts.map(p => p.sourceUrl));
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" })).newPage();
  const themesToProcess = mode === "all" ? Object.keys(THEMES) : [mode];
  let ok = 0, fail = 0;
  for (const tk of themesToProcess) {
    const theme = THEMES[tk]; if (!theme) continue;
    const files = readdirSync(join(BASE_DIR, theme.folder)).filter(f => f.endsWith(".txt"));
    console.log(`\n=== ${theme.folder} (${files.length} sub-cats) ===`);
    for (const file of files) {
      const subName = file.replace(".txt", "");
      const subSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const urls = readFileSync(join(BASE_DIR, theme.folder, file), "utf-8").split("\n").map(l => l.trim()).filter(l => l.startsWith("http"));
      const todo = urls.filter(u => !doneUrls.has(u)).slice(0, limit);
      if (!todo.length) { console.log(`  done: ${subName}`); continue; }
      console.log(`\n  -- ${subName} (${todo.length}/${urls.length}) --`);
      for (const url of todo) {
        process.stdout.write(`    ${url.split("/").pop().slice(0, 50)}...`);
        const d = await scrapeProduct(page, url);
        if (!d?.name || !d.images.length) { console.log(" SKIP"); fail++; continue; }
        const cdnUrls = [];
        for (const img of d.images) { const c = await uploadToCloudinary(img, subSlug); if (c) cdnUrls.push(c); }
        if (!cdnUrls.length) { console.log(" SKIP(cdn)"); fail++; continue; }
        allProducts.push({ name: d.name, description: d.description, images: cdnUrls, themeSlug: theme.themeSlug, subCatSlug: subSlug, subCatName: subName, sourceUrl: url });
        doneUrls.add(url); ok++;
        console.log(` OK(${cdnUrls.length})`);
        if (ok % 5 === 0) writeFileSync(OUTPUT_FILE, JSON.stringify(allProducts, null, 2));
        await page.waitForTimeout(800);
      }
    }
  }
  writeFileSync(OUTPUT_FILE, JSON.stringify(allProducts, null, 2));
  await browser.close();
  console.log(`\nDONE: ${ok} ok, ${fail} fail, ${allProducts.length} total → ${OUTPUT_FILE}`);
}

main().catch(e => { console.error(e); process.exit(1); });
