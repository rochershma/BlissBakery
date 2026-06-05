#!/usr/bin/env node
/**
 * Downloads all product images (all angles) from bakingo.com product pages.
 * Images are organized into category/product-name subfolders.
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const BASE_DIR = path.join(process.cwd(), 'public', 'uploads', 'products', 'bakingo');

const CATEGORIES = {
  'birthday-cakes': [
    'https://www.bakingo.com/p/cake/vanilla-rosette-birthday-cake-cake4034vani',
    'https://www.bakingo.com/p/cake/choco-ferrero-cake-cake4741ferr',
    'https://www.bakingo.com/p/cake/lip-smacking-chocolate-truffle-cake-cake2161choc',
    'https://www.bakingo.com/p/cake/fresh-fruit-cake0014frui',
    'https://www.bakingo.com/p/theme-cake/fondant-number-cake-them1459flav',
    'https://www.bakingo.com/p/cake/kit-kit-cake0018exch',
    'https://www.bakingo.com/p/cake/ferrero-rocher-cake0013exot',
  ],
  'kids-cakes': [
    'https://www.bakingo.com/p/theme-cake/hbd-cutesy-teddy-cake-them3268flav',
    'https://www.bakingo.com/p/theme-cake/king-kohli-rcb-cricket-cake-them4640flav',
    'https://www.bakingo.com/p/theme-cake/starry-unicorn-fondant-cake-them3768flav',
    'https://www.bakingo.com/p/theme-cake/fun-masha-n-bear-theme-cake-them3361flav',
    'https://www.bakingo.com/p/theme-cake/pink-barbie-theme-cake-them4784flav',
    'https://www.bakingo.com/p/theme-cake/cricket-kit-n-pitch-fondant-cake-them3720flav',
    'https://www.bakingo.com/p/theme-cake/glamour-makeup-theme-cake-them4889flav',
    'https://www.bakingo.com/p/theme-cake/butterfly-dreams-cake-them4891flav',
    'https://www.bakingo.com/p/theme-cake/princess-in-pink-gown-theme-cake-theme4223flav',
    'https://www.bakingo.com/p/theme-cake/first-birthday-mickey-cake-theme4225flav',
    'https://www.bakingo.com/p/theme-cake/minnie-mouse-birthday-cakes-them5143flav',
    'https://www.bakingo.com/p/theme-cake/butterfly-shaped-theme-cake-them4895flav',
    'https://www.bakingo.com/p/theme-cake/jungle-safari-party-cake-them4025flav',
    'https://www.bakingo.com/p/theme-cake/peppa-pig-sunshine-cake-them4866flav',
    'https://www.bakingo.com/p/theme-cake/playful-football-theme-cake-theme3900flav',
  ],
  'anniversary-cakes': [
    'https://www.bakingo.com/p/cake/heart-swirls-two-tiered-bento-cake-bento5800flav-bento5800flav',
    'https://www.bakingo.com/p/cake/heart-shaped-black-forest-vanilla-cake0039hbfv',
    'https://www.bakingo.com/p/cake/red-velvet-heart-cake-with-love-topper-cake3644redv',
    'https://www.bakingo.com/p/theme-cake/blossoming-butterflies-layer-cake-them4897flav',
    'https://www.bakingo.com/p/cake/heart-shaped-red-velvet-cake-cake1095redv',
    'https://www.bakingo.com/p/cake/fresh-fruit-cake0014frui',
    'https://www.bakingo.com/p/theme-cake/hearty-just-married-cake-them4362flav',
    'https://www.bakingo.com/p/cake/round-pink-roses-vanilla-cake-rosecake2561vani',
    'https://www.bakingo.com/p/cake/hearty-red-velvet-cake-cake3584redv',
    'https://www.bakingo.com/p/cake/red-velvet-cake-cake1631redv',
    'https://www.bakingo.com/p/cake/heartful-of-chocolate-cake3046choc',
  ],
  'wedding-cakes': [
    'https://www.bakingo.com/p/theme-cake/sweet-forever-floral-wedding-cake-them4369flav',
    'https://www.bakingo.com/p/theme-cake/hearty-just-married-cake-them4362flav',
  ],
  'designer-cakes': [
    'https://www.bakingo.com/p/theme-cake/round-shaped-fondant-cake-them958flav',
    'https://www.bakingo.com/p/theme-cake/pastel-paradise-birthday-cake-them3872flav',
    'https://www.bakingo.com/p/theme-cake/number-cake-them1454flav',
  ],
  'fathers-day-cakes': [
    'https://www.bakingo.com/p/cake/chocolate-truffle-cake-cake2677choc',
    'https://www.bakingo.com/p/cake/vanilla-sprinkle-dads-day-cake-cake3320vani',
    'https://www.bakingo.com/p/cake/creamy-pineapple-cake-for-dad-cake3870pine',
    'https://www.bakingo.com/p/cake/tic-tac-dad-cake-cake2666choc',
    'https://www.bakingo.com/p/cake/best-dad-ever-chocolate-cake-cake3841choco',
    'https://www.bakingo.com/p/cake/velvety-fruit-cake-for-dad-cake4813frui',
  ],
  'mothers-day-cakes': [
    'https://www.bakingo.com/p/cake/mothers-day-glazed-chocolate-truffle-cake-cake2617choc',
    'https://www.bakingo.com/p/cake/moms-day-black-forest-cake-cake4680blac',
    'https://www.bakingo.com/p/cake/essence-of-love-vday-cake-cake3171pine',
    'https://www.bakingo.com/p/photo-cake/love-you-maa-poster-cake-phot1372flav',
    'https://www.bakingo.com/p/cake/gooey-round-chocolate-love-cake-cake2571choc',
    'https://www.bakingo.com/p/cake/love-u-mom-red-velvet-cake-cake5933redv',
    'https://www.bakingo.com/p/cake/moms-slice-floral-cake-cake5950flav',
  ],
  'doctors-day-cakes': [
    'https://www.bakingo.com/p/cake/doc-day-truffle-cake-cake2704choc',
    'https://www.bakingo.com/p/cake/doc-day-butterscotch-cake-cake2698butt',
    'https://www.bakingo.com/p/theme-cake/doctor-coat-fondant-cake-them3718flav',
  ],
  'rakhi-cakes': [
    'https://www.bakingo.com/p/rakhi/chocolate-ferrero-rocher-cake-with-floral-rakhi-cake4094choco',
    'https://www.bakingo.com/p/rakhi/golden-rakhi-truffle-cake-cake4091choco',
    'https://www.bakingo.com/p/rakhi/best-bro-butterscotch-cake-with-designer-rakhis-cake4090butt',
    'https://www.bakingo.com/p/rakhi/chill-with-bro-rakhi-cake-them5037flav',
    'https://www.bakingo.com/p/rakhi/pineapple-cake-n-floral-rakhi-for-brother-cake4089pine',
  ],
  'independence-day-cakes': [
    'https://www.bakingo.com/p/cake/independence-day-special-choco-truffle-cake-cake5060choco',
  ],
  'new-year-cakes': [
    'https://www.bakingo.com/p/photo-cake/new-year-party-cake-phot4419flav',
    'https://www.bakingo.com/p/cake/kitkat-chocolate-new-year-cake-cake5589kikat',
    'https://www.bakingo.com/p/cakes/new-year-pineapple-cake-cake4389pine',
    'https://www.bakingo.com/p/cake/new-year-oreo-indulgence-cake-cake4450choc',
    'https://www.bakingo.com/p/cake/new-year-butterscotch-cake-cake1084butt',
    'https://www.bakingo.com/p/cake/pineapple-ny-cake-cake3089pine',
    'https://www.bakingo.com/p/cake/choco-loaded-ny-cake-cake3102choc',
  ],
  'baby-shower-cakes': [
    'https://www.bakingo.com/p/theme-cake/baby-girl-baby-boy-cake-them1467flav',
    'https://www.bakingo.com/p/theme-cake/its-a-girl-polka-design-fondant-cake-them3278flav',
    'https://www.bakingo.com/p/theme-cake/baby-girl-shower-cakes-them5172flav',
  ],
  'congratulations-cakes': [
    'https://www.bakingo.com/p/theme-cake/congrats-heart-shaped-cake-them4342flav',
    'https://www.bakingo.com/p/theme-cake/congrats-floral-cake-them4341flav',
  ],
  'retirement-cakes': [
    'https://www.bakingo.com/p/theme-cake/heartfelt-retirement-cake-them4354flav',
    'https://www.bakingo.com/p/theme-cake/retirement-clock-theme-cake-them4356flav',
    'https://www.bakingo.com/p/theme-cake/retirement-cream-cake-2-them772flav',
    'https://www.bakingo.com/p/theme-cake/healthcare-theme-retirement-cake-them4349flav',
  ],
  'farewell-cakes': [
    'https://www.bakingo.com/p/theme-cake/leader-farewell-cake-them4355flav',
  ],
};

// Deduplicate URLs across categories (same URL can appear in multiple categories)
function getUniqueUrls() {
  const seen = new Set();
  const result = [];
  for (const [category, urls] of Object.entries(CATEGORIES)) {
    for (const url of urls) {
      if (!seen.has(url)) {
        seen.add(url);
        result.push({ category, url });
      } else {
        // Still add to result so it gets copied to this category folder too
        result.push({ category, url, duplicate: true });
      }
    }
  }
  return result;
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function extractProductImages(html) {
  // Extract from the JSON data embedded in the page - look for "images":[ pattern
  const images = [];
  
  // Method 1: Look for "images":[{"src":"..."} pattern in embedded JSON
  const imgPattern = /"images"\s*:\s*\[\s*\{[^}]*"src"\s*:\s*"(https:\/\/bkmedia\.bakingo\.com\/[^"]+)"/g;
  let match;
  while ((match = imgPattern.exec(html)) !== null) {
    if (!images.includes(match[1]) && !match[1].includes('review_image') && !match[1].includes('sq-')) {
      images.push(match[1]);
    }
  }

  // Method 2: Look for all bkmedia product image URLs  
  const allImgPattern = /https:\/\/bkmedia\.bakingo\.com\/[a-z0-9-]+(?:-[A-Za-z_0-9]+)?\.(?:jpg|jpeg|png|webp)/g;
  while ((match = allImgPattern.exec(html)) !== null) {
    const url = match[0];
    if (!images.includes(url) &&
        !url.includes('review_image') &&
        !url.includes('ssr-static') &&
        !url.includes('bkssr') &&
        !url.includes('/bk/') &&
        !url.includes('sq-') &&
        !url.includes('city/') &&
        !url.includes('1000x750') &&
        !url.includes('re-star') &&
        !url.includes('addon')) {
      images.push(url);
    }
  }

  return [...new Set(images)];
}

function extractProductName(html, url) {
  // Try to get the product title from the page
  const titleMatch = html.match(/"title"\s*:\s*"([^"]+)"/);
  if (titleMatch) {
    return titleMatch[1]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  // Fallback: extract from URL
  const slug = url.split('/').pop();
  return slug;
}

async function downloadImage(imageUrl, destPath) {
  try {
    const { status, body } = await fetchUrl(imageUrl);
    if (status === 200 && body.length > 1000) {
      fs.writeFileSync(destPath, body);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

async function processProduct(category, url) {
  const slug = url.split('/').pop();
  console.log(`\n📦 Processing: ${slug}`);
  console.log(`   Category: ${category}`);
  
  try {
    const { status, body } = await fetchUrl(url);
    if (status !== 200) {
      console.log(`   ❌ HTTP ${status}`);
      return { category, slug, images: 0, error: `HTTP ${status}` };
    }
    
    const html = body.toString('utf8');
    const productName = extractProductName(html, url);
    const imageUrls = extractProductImages(html);
    
    if (imageUrls.length === 0) {
      console.log(`   ⚠️  No images found`);
      return { category, slug: productName, images: 0, error: 'no images' };
    }
    
    console.log(`   Found ${imageUrls.length} images for "${productName}"`);
    
    const productDir = path.join(BASE_DIR, category, productName);
    fs.mkdirSync(productDir, { recursive: true });
    
    let downloaded = 0;
    for (let i = 0; i < imageUrls.length; i++) {
      const imgUrl = imageUrls[i];
      const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
      const filename = `${productName}-${i + 1}${ext}`;
      const destPath = path.join(productDir, filename);
      
      if (fs.existsSync(destPath)) {
        console.log(`   ⏭️  Already exists: ${filename}`);
        downloaded++;
        continue;
      }
      
      const ok = await downloadImage(imgUrl, destPath);
      if (ok) {
        downloaded++;
        console.log(`   ✅ ${filename}`);
      } else {
        console.log(`   ❌ Failed: ${imgUrl}`);
      }
      
      // Small delay to be polite
      await new Promise(r => setTimeout(r, 200));
    }
    
    return { category, slug: productName, images: downloaded };
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
    return { category, slug, images: 0, error: e.message };
  }
}

async function main() {
  console.log('🎂 Bakingo Product Image Downloader');
  console.log(`📁 Output: ${BASE_DIR}\n`);
  
  const entries = getUniqueUrls();
  const totalProducts = entries.length;
  console.log(`Total products to process: ${totalProducts}`);
  
  const results = [];
  
  for (let i = 0; i < entries.length; i++) {
    const { category, url } = entries[i];
    console.log(`\n[${i + 1}/${totalProducts}]`);
    const result = await processProduct(category, url);
    results.push(result);
    
    // Delay between products
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Summary
  console.log('\n\n📊 DOWNLOAD SUMMARY');
  console.log('='.repeat(60));
  
  let totalImages = 0;
  let failures = 0;
  
  for (const [cat, urls] of Object.entries(CATEGORIES)) {
    const catResults = results.filter(r => r.category === cat);
    const catImages = catResults.reduce((sum, r) => sum + r.images, 0);
    const catFails = catResults.filter(r => r.error).length;
    console.log(`\n${cat}: ${catResults.length} products, ${catImages} images${catFails ? `, ${catFails} failures` : ''}`);
    totalImages += catImages;
    failures += catFails;
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total: ${totalImages} images downloaded, ${failures} failures`);
}

main().catch(console.error);
