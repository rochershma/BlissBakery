/**
 * Re-scrape HD images for products that had low quality thumbnails.
 * Runs locally with Playwright, uploads to Cloudinary, saves results to JSON.
 * Then use fix-hd-images-apply.mjs on server to update DB.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "fs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dvw9o0f8z",
  api_key: "792441267859941",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Products that need HD images (names from server check)
const NEED_FIX = [
  "Alphabet R Candy Cake", "Alphabet N Cake", "Number Two Pink Bow Cake",
  "Astronaut Space Fondant Cake", "Starry Number One Cake", "Rosette Number One Cake",
  "Alphabet A Cake", "Splendid A Alphabet Cake", "Alphabet P Sports Theme Cake",
  "Triple Tiered Avengers Cake", "Vibrant Rainbow Unicorn Fondant Cake",
  "Magical Elsa Theme Cake", "Welcome Baby Girl Cake", "Racing Wheels Theme Cake",
  "Mickey Mouse Stars Cake", "Superhero Duo Hulk N Spiderman Cake",
  "Hulk Power Punch Theme Cake", "Mighty Hulk Avengers Theme Cake",
  "The Incredible Hulk Theme Cake", "Magical Unicorn Rainbow Cake",
  "Hulk Marvel Theme Cake", "Cocomelon Rainbow First Birthday Cake",
  "Graceful Silhouette Butterfly Cake", "Flutter N Glitter Butterfly Cake",
  "Butterfly N Blooms Theme Cake", "Pearls N Princess Butterfly Cake",
  "Fancy Car Fondant Cake", "Blushing Number Three Cake", "Joyful Number Two Cake",
  "Joyride Number Four Cake", "Floral Number Fondant Cake", "Barbie Bliss Theme Cake",
  "Frozen Fondant Cake", "Velvety Purple Bow Cake", "Income Tax Fun Theme Cake",
  "No Pain No Gain Gym Cake", "Flex N Frosting Gym Cake", "Gym Fondant Cake 2",
  "The Gym Girl Cake", "Bodybuilder Goals Gym Cake", "Beast Mode Gym Cake",
  "Muscle Mode On Gym Cake", "Muscle Munch Gym Cake", "Dumbbells Loaded Gym Cake",
  "Fit Girl Gym Cake",
];

const scraped = JSON.parse(readFileSync("scripts/scraped-products.json", "utf-8"));
const sourceMap = new Map(scraped.map(p => [p.name, p]));

async function main() {
  if (!process.env.CLOUDINARY_API_SECRET) { console.error("Set CLOUDINARY_API_SECRET!"); process.exit(1); }

  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" })).newPage();

  const results = [];
  let fixed = 0, failed = 0;

  for (const name of NEED_FIX) {
    const source = sourceMap.get(name);
    if (!source) { console.log(`  SKIP ${name}: no source`); failed++; continue; }

    process.stdout.write(`  ${name}...`);
    
    try {
      await page.goto(source.sourceUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(5000);
      
      const images = await page.evaluate((url) => {
        const pat = (url.match(/(?:them|theme|cake|phot|pina|redv|choc|haze|pine|flav|cara|rash)\d+/i) || [])[0]?.toLowerCase() || "";
        const imgs = new Set();
        document.querySelectorAll("img").forEach(img => {
          const src = (img.src || img.dataset?.src || "").replace(/\?.*$/, "");
          if (!src.includes("bkmedia.bakingo.com") || src.includes("ssr-static") || src.includes("sprite") || src.includes("fav_") || src.includes("AAA")) return;
          if (pat && src.split("/").pop().toLowerCase().includes(pat)) imgs.add(src);
        });
        // Fallback: large visible images
        if (imgs.size === 0) {
          document.querySelectorAll("img").forEach(img => {
            const src = (img.src || "").replace(/\?.*$/, "");
            if (src.includes("bkmedia") && !src.includes("ssr-static") && !src.includes("AAA") && (img.naturalWidth >= 200)) imgs.add(src);
          });
        }
        return [...imgs].slice(0, 4);
      }, source.sourceUrl);
      
      if (images.length === 0) { console.log(" NO IMGS"); failed++; continue; }
      
      // Upload and verify HD
      const cdnUrls = [];
      for (const imgUrl of images) {
        try {
          const r = await cloudinary.uploader.upload(imgUrl, { folder: `blissbakery/themes/${source.subCatSlug}`, quality: "auto:best", format: "jpg" });
          // Verify size
          const check = await fetch(r.secure_url, { method: "HEAD" });
          const kb = Math.round(parseInt(check.headers.get("content-length") || "0") / 1024);
          if (kb >= 20) cdnUrls.push(r.secure_url);
        } catch {}
      }
      
      if (cdnUrls.length > 0) {
        results.push({ name, images: cdnUrls });
        fixed++;
        console.log(` OK(${cdnUrls.length})`);
      } else {
        console.log(" UPLOAD FAIL");
        failed++;
      }
    } catch { console.log(" ERR"); failed++; }
    
    await page.waitForTimeout(800);
  }

  await browser.close();
  writeFileSync("scripts/hd-fixes.json", JSON.stringify(results, null, 2));
  console.log(`\nDone: ${fixed} fixed, ${failed} failed → scripts/hd-fixes.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
