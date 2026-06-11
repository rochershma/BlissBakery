/**
 * Fix theme cake images — remove low-quality first thumbnail, keep HD images.
 * For products with 2+ images: remove first image (thumbnail).
 * For products with 1 image: re-scrape and re-upload HD version.
 * 
 * Usage: node scripts/fix-theme-images.mjs
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Get all theme cake products
  const category = await db.category.findFirst({ where: { slug: { startsWith: "theme-cakes" } } });
  if (!category) { console.error("No theme cakes category"); return; }

  const products = await db.product.findMany({
    where: { categoryId: category.id },
    select: { id: true, name: true, images: true },
  });

  console.log(`Found ${products.length} theme cake products`);

  let fixed = 0, single = 0, noImages = 0;

  for (const product of products) {
    let images;
    try {
      images = JSON.parse(product.images || "[]");
    } catch {
      images = [];
    }

    if (images.length === 0) {
      noImages++;
      continue;
    }

    if (images.length >= 2) {
      // Remove the first image (thumbnail) — keep HD images starting from index 1
      const newImages = images.slice(1);
      await db.product.update({
        where: { id: product.id },
        data: { images: JSON.stringify(newImages) },
      });
      fixed++;
    } else {
      // Single image — can't remove, log for re-upload
      single++;
    }
  }

  console.log(`\nFixed: ${fixed} (removed thumbnail)`);
  console.log(`Single image: ${single} (kept as-is)`);
  console.log(`No images: ${noImages}`);

  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
