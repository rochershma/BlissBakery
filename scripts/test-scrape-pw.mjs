// Scrape Bakingo product using browser (Playwright) to get actual product images
import { chromium } from "playwright";

const url = process.argv[2] || "https://www.bakingo.com/p/theme-cake/amazing-spiderman-cake-theme3982flav";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log("Loading:", url);
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const data = await page.evaluate(() => {
    // Get product name
    const h1 = document.querySelector("h1");
    const name = h1?.textContent?.trim() || "";
    
    // Get description from meta
    const metaDesc = document.querySelector('meta[name="description"]');
    const description = metaDesc?.getAttribute("content") || "";
    
    // Get product images — these are the main carousel/gallery images
    // Bakingo uses swiper or image gallery for product photos
    const productImgs = new Set();
    
    // Method 1: Look for large product images in the gallery/swiper
    document.querySelectorAll("img").forEach(img => {
      const src = img.src || img.dataset?.src || "";
      const alt = img.alt || "";
      // Product images are typically from bkmedia with specific patterns
      if (src.includes("bkmedia.bakingo.com") && !src.includes("ssr-static") && !src.includes("sprite") && !src.includes("fav_") && !src.includes("logo")) {
        // Check if it's a product-sized image (not tiny icon)
        const w = img.naturalWidth || img.width || 0;
        const h = img.naturalHeight || img.height || 0;
        if (w > 100 || h > 100 || src.includes("sq-") || src.includes("flav-") || src.includes("_0") || src.includes("_1")) {
          productImgs.add(src);
        }
      }
    });
    
    // Method 2: Check for lazy-loaded images in data attributes
    document.querySelectorAll("[data-src], [data-lazy]").forEach(el => {
      const src = el.dataset?.src || el.dataset?.lazy || "";
      if (src.includes("bkmedia.bakingo.com") && !src.includes("ssr-static")) {
        productImgs.add(src);
      }
    });
    
    // Method 3: Check background images
    document.querySelectorAll("[style*='background-image']").forEach(el => {
      const match = el.style.backgroundImage.match(/url\(["']?([^"')]+)/);
      if (match?.[1]?.includes("bkmedia.bakingo.com") && !match[1].includes("ssr-static")) {
        productImgs.add(match[1]);
      }
    });
    
    return { name, description: description.slice(0, 500), images: [...productImgs] };
  });
  
  console.log("Name:", data.name);
  console.log("Description:", data.description.slice(0, 150));
  console.log("Product Images:", data.images.length);
  data.images.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
  
  await browser.close();
})();
