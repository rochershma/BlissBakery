/**
 * Re-scrape and re-upload HD images for products with empty/bad images.
 * Finds source URLs from scraped-products.json, re-visits with Playwright,
 * gets ALL product images (not just first), uploads to Cloudinary.
 */
import { chromium } from "playwright";
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dvw9o0f8z",
  api_key: "792441267859941",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const db = new PrismaClient();

async function scrapeHDImages(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(5000); // Extra wait for lazy images
    
    return await page.evaluate((pageUrl) => {
      const slugMatch = pageUrl.match(/(?:them|theme|cake|phot|pina|redv|choc|haze|pine|flav|cara|rash)\d+/i);
      const pat = slugMatch?.[0]?.toLowerCase() || "";
      const imgs = new Set();
      
      // Get ALL images matching product pattern
      document.querySelectorAll("img").forEach(img => {
        const src = (img.src || img.dataset?.src || "").replace(/\?.*$/, "");
        if (!src.includes("bkmedia.bakingo.com") || src.includes("ssr-static") || src.includes("sprite") || src.includes("fav_")) return;
        const filename = src.split("/").pop().toLowerCase();
        // Match product slug OR common product image patterns
        if (pat && filename.includes(pat)) imgs.add(src);
      });
      
      // If no pattern match, try getting the largest visible images
      if (imgs.size === 0) {
        document.querySelectorAll("img").forEach(img => {
          const src = (img.src || "").replace(/\?.*$/, "");
          if (src.includes("bkmedia.bakingo.com") && !src.includes("ssr-static") && !src.includes("sprite") && !src.includes("fav_") && !src.includes("AAA")) {
            if (img.naturalWidth >= 200 || img.naturalHeight >= 200) imgs.add(src);
          }
        });
      }
      
      return [...imgs].slice(0, 4);
    }, url);
  } catch { return []; }
}

async function uploadToCloudinary(imageUrl, folder) {
  try {
    const r = await cloudinary.uploader.upload(imageUrl, { folder: `blissbakery/themes/${folder}`, quality: "auto:best", format: "jpg" });
    return r.secure_url;
  } catch { return null; }
}

async function main() {
  if (!process.env.CLOUDINARY_API_SECRET) { console.error("Set CLOUDINARY_API_SECRET!"); process.exit(1); }
  
  // Load scraped data to find source URLs
  const scraped = JSON.parse(readFileSync("scripts/scraped-products.json", "utf-8"));
  const sourceMap = new Map(scraped.map(p => [p.name, p]));
  
  // Find products with empty images
  const cat = await db.category.findFirst({ where: { slug: { startsWith: "theme-cakes" } } });
  const emptyProducts = await db.product.findMany({
    where: { categoryId: cat.id, images: "[]" },
    select: { id: true, name: true },
  });
  
  console.log(`${emptyProducts.length} products need HD images`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" })).newPage();
  
  let fixed = 0, failed = 0;
  
  for (const product of emptyProducts) {
    const source = sourceMap.get(product.name);
    if (!source || !source.sourceUrl) {
      console.log(`  SKIP ${product.name}: no source URL`);
      failed++;
      continue;
    }
    
    process.stdout.write(`  ${product.name}...`);
    
    const images = await scrapeHDImages(page, source.sourceUrl);
    if (images.length === 0) {
      console.log(" NO IMAGES");
      failed++;
      continue;
    }
    
    // Upload to Cloudinary — skip first if it looks like a thumbnail (same URL pattern as HD ones)
    const cdnUrls = [];
    for (const imgUrl of images) {
      const cdn = await uploadToCloudinary(imgUrl, source.subCatSlug);
      if (cdn) {
        // Check if HD (>30KB)
        try {
          const r = await fetch(cdn, { method: "HEAD" });
          const kb = Math.round(parseInt(r.headers.get("content-length") || "0") / 1024);
          if (kb >= 25) cdnUrls.push(cdn);
        } catch { cdnUrls.push(cdn); }
      }
    }
    
    if (cdnUrls.length === 0) {
      console.log(" UPLOAD FAILED");
      failed++;
      continue;
    }
    
    // Update product
    await db.product.update({
      where: { id: product.id },
      data: { images: JSON.stringify(cdnUrls) },
    });
    
    fixed++;
    console.log(` OK (${cdnUrls.length} HD)`);
    await page.waitForTimeout(800);
  }
  
  console.log(`\nDone: ${fixed} fixed, ${failed} failed`);
  await browser.close();
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
