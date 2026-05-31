import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

// Build a set of all files that actually exist
const bakingo = path.join(__dirname, "..", "public", "images", "bakingo");
const heroDir = path.join(__dirname, "..", "public", "images", "hero");
const uploadsDir = path.join(__dirname, "..", "public", "uploads", "products");
const productsDir = path.join(__dirname, "..", "public", "images", "products");

function listFiles(dir: string): string[] {
  try { return fs.readdirSync(dir); } catch { return []; }
}

const existingBakingo = new Set(listFiles(bakingo));
const existingHero = new Set(listFiles(heroDir));
const existingUploads = new Set(listFiles(uploadsDir));
const existingProducts = new Set(listFiles(productsDir));

function fileExists(imgPath: string): boolean {
  if (imgPath.startsWith("/images/bakingo/")) {
    return existingBakingo.has(imgPath.replace("/images/bakingo/", ""));
  }
  if (imgPath.startsWith("/images/hero/")) {
    return existingHero.has(imgPath.replace("/images/hero/", ""));
  }
  if (imgPath.startsWith("/uploads/products/")) {
    return existingUploads.has(imgPath.replace("/uploads/products/", ""));
  }
  if (imgPath.startsWith("/images/products/")) {
    return existingProducts.has(imgPath.replace("/images/products/", ""));
  }
  return false;
}

// Map from broken references to correct file names
const IMAGE_FIX_MAP: Record<string, string> = {
  // chocochip → choco-chip
  "/images/bakingo/chocochip-a.jpg": "/images/bakingo/choco-chip-1.jpg",
  "/images/bakingo/chocochip-b.jpg": "/images/bakingo/choco-chip-2.jpg",
  "/images/bakingo/chocochip-c.jpg": "/images/bakingo/choco-chip-1.jpg",
  // blackforest → black-forest
  "/images/bakingo/blackforest-a.jpg": "/images/bakingo/black-forest-1.jpg",
  "/images/bakingo/blackforest-b.jpg": "/images/bakingo/black-forest-2.jpg",
  "/images/bakingo/blackforest-c.jpg": "/images/bakingo/blackforest-c.jpg", // exists
  // kitkat
  "/images/bakingo/kitkat-a.jpg": "/images/bakingo/kitkat-1.jpg",
  "/images/bakingo/kitkat-b.jpg": "/images/bakingo/kitkat-2.jpg",
  "/images/bakingo/kitkat-c.jpg": "/images/bakingo/kitkat-cake-3.jpg",
  // fruitcake → fruit-cake
  "/images/bakingo/fruitcake-a.jpg": "/images/bakingo/fruit-cake-1.jpg",
  "/images/bakingo/fruitcake-b.jpg": "/images/bakingo/fruit-cake-2.jpg",
  "/images/bakingo/fruitcake-c.jpg": "/images/bakingo/fruit-cake-1.jpg",
  // belgianchoco → belgian-choco
  "/images/bakingo/belgianchoco-a.jpg": "/images/bakingo/belgian-choco-1.jpg",
  "/images/bakingo/belgianchoco-b.jpg": "/images/bakingo/belgian-choco-2.jpg",
  "/images/bakingo/belgianchoco-c.jpg": "/images/bakingo/belgian-choco-1.jpg",
  // blueberry
  "/images/bakingo/blueberry-a.jpg": "/images/bakingo/blueberry-1.jpg",
  "/images/bakingo/blueberry-b.jpg": "/images/bakingo/blueberry-cheese-1.jpg",
  "/images/bakingo/blueberry-c.jpg": "/images/bakingo/blueberry-cheese-2.jpg",
  // chocodream → choco-dream
  "/images/bakingo/chocodream-a.jpg": "/images/bakingo/choco-dream-1.jpg",
  "/images/bakingo/chocodream-b.jpg": "/images/bakingo/choco-dream-2.jpg",
  // chocovanilla → choco-vanilla
  "/images/bakingo/chocovanilla-a.jpg": "/images/bakingo/choco-vanilla-1.jpg",
  "/images/bakingo/chocovanilla-b.jpg": "/images/bakingo/choco-vanilla-2.jpg",
  "/images/bakingo/chocovanilla-c.jpg": "/images/bakingo/choco-vanilla-1.jpg",
  // rasmalai
  "/images/bakingo/rasmalai-a.jpg": "/images/bakingo/rasmalai-1.jpg",
  "/images/bakingo/rasmalai-b.jpg": "/images/bakingo/rasmalai-2.jpg",
  "/images/bakingo/rasmalai-c.jpg": "/images/bakingo/rasmalai-1.jpg",
  // pineapple
  "/images/bakingo/pineapple-a.jpg": "/images/bakingo/pineapple-1.jpg",
  "/images/bakingo/pineapple-b.jpg": "/images/bakingo/pineapple-2.jpg",
  "/images/bakingo/pineapple-c.jpg": "/images/bakingo/pineapple-1.jpg",
  // barbie
  "/images/bakingo/barbie-a.jpg": "/images/bakingo/barbie-cake-1.jpg",
  "/images/bakingo/barbie-b.jpg": "/images/bakingo/barbie-cake-2.jpg",
  "/images/bakingo/barbie-1.jpg": "/images/bakingo/barbie-cake-1.jpg",
  // rosebutterfly — no file, use rosette
  "/images/bakingo/rosebutterfly-a.jpg": "/images/bakingo/rosette-a.jpg",
  "/images/bakingo/rosebutterfly-b.jpg": "/images/bakingo/rosechoco-a.jpg",
  "/images/bakingo/rosebutterfly-c.jpg": "/images/bakingo/rosette-a.jpg",
  // teddybear — no file, use jungle
  "/images/bakingo/teddybear-a.jpg": "/images/bakingo/jungle-a.jpg",
  // red-velvet-heart
  "/images/bakingo/red-velvet-heart-2.jpg": "/images/bakingo/red-velvet-heart-1.jpg",
  // choco-dream
  "/images/bakingo/choco-dream-1.jpg": "/images/bakingo/choco-dream-1.jpg", // should exist
  // fruit-cake — these exist but may have issues
  "/images/bakingo/fruit-cake-1.jpg": "/images/bakingo/fruit-cake-1.jpg",
  // pineapple-1 (this exists)
  "/images/bakingo/pineapple-1.jpg": "/images/bakingo/pineapple-1.jpg",
  // chocorollup exists
  "/images/bakingo/chocorollup-a.jpg": "/images/bakingo/chocorollup-a.jpg",
  // hero images that might have issues — map to existing
  "/images/hero/1_1freshananashcake.png": "/images/hero/AMMO6974.jpg",
  "/images/hero/TuileriesCHOCBERRIES.jpg": "/images/hero/TuileriesCHOCTRUFFLE.jpg",
  "/images/hero/Mango-BlueberryEnt.jpg": "/images/hero/TuileriesMANGOBB.jpg",
  // product images
  "/images/products/Gold-Cheesecake--br-_700-grams_-Tuileries-Patisserie-1658593281.jpg": "/images/hero/AMMO6974.jpg",
  "/images/products/Belgian-chocolate-chip-cookies-Tuileries-Patisserie-1658593452.jpg": "/images/hero/AMMO6974.jpg",
  "/images/products/Belgian-Dark-chocolate-chip-cookies-Tuileries-Patisserie-1658593471.jpg": "/images/hero/AMMO6974.jpg",
};

function fixImage(imgPath: string): string | null {
  // Already exists? Keep it
  if (fileExists(imgPath)) return imgPath;
  
  // Check the fix map
  const mapped = IMAGE_FIX_MAP[imgPath];
  if (mapped && fileExists(mapped)) return mapped;
  
  // For uploads that don't exist, drop them
  if (imgPath.startsWith("/uploads/")) return null;
  
  // Fallback: try to find a similar file
  const basename = path.basename(imgPath, path.extname(imgPath));
  // Try common patterns: name-a → name-1, name-b → name-2
  const base = basename.replace(/-[abc]$/, "");
  for (const suffix of ["-1.jpg", "-2.jpg", "-a.jpg", "-1.png", "-cake-1.jpg"]) {
    const tryName = base + suffix;
    if (existingBakingo.has(tryName)) {
      return "/images/bakingo/" + tryName;
    }
  }
  
  // Last resort: drop it
  return null;
}

async function main() {
  const products = await db.product.findMany({ select: { id: true, name: true, images: true } });
  
  let totalFixed = 0;
  let totalDropped = 0;
  let totalUnchanged = 0;
  
  for (const product of products) {
    const imgs: string[] = (() => {
      try {
        const parsed = JSON.parse(product.images as string);
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    })();
    
    if (imgs.length === 0) continue;
    
    const newImgs: string[] = [];
    let changed = false;
    
    for (const img of imgs) {
      const fixed = fixImage(img);
      if (fixed === null) {
        totalDropped++;
        changed = true;
        console.log(`  DROP: ${img} (no file found)`);
      } else if (fixed !== img) {
        totalFixed++;
        changed = true;
        newImgs.push(fixed);
        console.log(`  FIX:  ${img} → ${fixed}`);
      } else {
        totalUnchanged++;
        newImgs.push(img);
      }
    }
    
    // Deduplicate
    const deduped = [...new Set(newImgs)];
    
    // If product has NO images after fixing, give it a fallback
    if (deduped.length === 0) {
      deduped.push("/images/bakingo/choco-truffle-1.jpg");
      console.log(`  FALLBACK: ${product.name} → choco-truffle-1.jpg`);
    }
    
    if (changed || deduped.length !== newImgs.length) {
      await db.product.update({
        where: { id: product.id },
        data: { images: JSON.stringify(deduped) },
      });
      console.log(`✅ ${product.name}: ${imgs.length} → ${deduped.length} images`);
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Fixed: ${totalFixed} image references`);
  console.log(`Dropped: ${totalDropped} missing images`);
  console.log(`Unchanged: ${totalUnchanged} already correct`);
  console.log(`Total products: ${products.length}`);
}

main().catch(console.error).finally(() => db.$disconnect());
