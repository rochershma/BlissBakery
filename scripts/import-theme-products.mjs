/**
 * Import scraped theme cake products into the database.
 * 
 * - Custom pricing: ₹300 design charge, all flavours, default sizes
 * - Tags each product with theme + themeTag
 * - Category: Theme Cakes
 * 
 * Usage: node scripts/import-theme-products.mjs
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const db = new PrismaClient();
const INPUT_FILE = "scripts/scraped-products.json";

async function main() {
  const products = JSON.parse(readFileSync(INPUT_FILE, "utf-8"));
  console.log(`Loaded ${products.length} products to import`);

  // Get store + category
  const store = await db.store.findFirst();
  if (!store) { console.error("No store found!"); return; }

  // Find or create "Theme Cakes" category
  let category = await db.category.findFirst({ where: { slug: { startsWith: "theme-cakes" } } });
  if (!category) {
    category = await db.category.create({
      data: { name: "Theme Cakes", slug: "theme-cakes-auto", image: null, isVisible: true, sortOrder: 10, storeId: store.id },
    });
    console.log("Created Theme Cakes category:", category.id);
  }
  console.log("Category:", category.name, category.id);

  // Get store flavour/size config for custom pricing
  const defaultFlavours = (() => {
    try { return JSON.parse(store.defaultFlavours || "[]"); } catch { return []; }
  })();
  const defaultFlavourPrices = (() => {
    try { return JSON.parse(store.defaultFlavourPrices || "[]"); } catch { return []; }
  })();
  const defaultSizes = (() => {
    try { return JSON.parse(store.defaultCustomSizes || "[]"); } catch { return []; }
  })();

  console.log(`Flavours: ${defaultFlavours.length}, Prices: ${defaultFlavourPrices.length}, Sizes: ${defaultSizes.length}`);

  // Design charge for all theme cakes
  const DESIGN_CHARGE = 300;
  
  // Calculate base price from cheapest flavour + smallest size
  const cheapest500g = defaultFlavourPrices.length > 0 
    ? Math.min(...defaultFlavourPrices.map(fp => fp.price500g || 999)) 
    : (store.defaultBase500gPrice || 300);
  
  // Default size configs
  const sizeConfigs = defaultSizes.length > 0 ? defaultSizes : [
    { name: "0.5 Kg", weightKg: 0.5, serves: "Serves 4-6" },
    { name: "1 Kg", weightKg: 1, serves: "Serves 8-10" },
    { name: "1.5 Kg", weightKg: 1.5, serves: "Serves 12-15" },
    { name: "2 Kg", weightKg: 2, serves: "Serves 18-20" },
  ];

  let created = 0, skipped = 0, failed = 0;

  for (const p of products) {
    try {
      // Check if product with similar name already exists
      const existing = await db.product.findFirst({ where: { name: p.name } });
      if (existing) {
        skipped++;
        continue;
      }

      // Generate unique slug
      const baseSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const slug = baseSlug + "-" + Date.now().toString(36);

      // Clean description — remove Bakingo branding
      let desc = (p.description || "")
        .replace(/Bakingo[^.]*\./gi, "")
        .replace(/Order .+ online[^.]*\./gi, "")
        .replace(/✓Free Delivery/gi, "")
        .replace(/available from .+ Kg\./gi, "")
        .trim();
      if (!desc || desc.length < 20) {
        desc = `A beautifully crafted ${p.name} — perfect for celebrations. 100% eggless, freshly baked with premium ingredients.`;
      }

      // Calculate variants with custom pricing
      const variants = sizeConfigs.map((size, i) => ({
        name: size.name,
        price: Math.round(cheapest500g * (size.weightKg || 0.5) * 2 + DESIGN_CHARGE),
        serves: size.serves || null,
        sortOrder: i,
        isAvailable: true,
      }));

      const basePrice = variants.length > 0 ? variants[0].price : Math.round(cheapest500g + DESIGN_CHARGE);

      // Create product
      const product = await db.product.create({
        data: {
          name: p.name,
          slug,
          shortDesc: `Premium ${p.subCatName?.replace(" Cakes", "")} theme cake — 100% eggless`,
          description: desc,
          basePrice,
          images: JSON.stringify(p.images),
          categoryId: category.id,
          isBestseller: false,
          isNew: true,
          isFeatured: false,
          isAvailable: true,
          occasions: JSON.stringify([]),
          themes: JSON.stringify([p.themeSlug]),
          themeTags: JSON.stringify([p.subCatSlug]),
          forWhom: JSON.stringify([]),
          flavours: JSON.stringify(defaultFlavours),
          pricingStrategy: "CUSTOM",
          flavourPrices: JSON.stringify(defaultFlavourPrices),
          designCharge: DESIGN_CHARGE,
          base500gPrice: cheapest500g,
          defaultFlavour: defaultFlavours[0] || null,
          variants: {
            create: variants,
          },
        },
      });

      created++;
      if (created % 50 === 0) console.log(`  ...created ${created} products`);
    } catch (e) {
      failed++;
      if (failed <= 5) console.error(`  FAIL: ${p.name}: ${e.message?.slice(0, 80)}`);
    }
  }

  console.log(`\nDONE: Created ${created}, Skipped ${skipped} (duplicate), Failed ${failed}`);
  console.log(`Total theme products in DB: ${await db.product.count({ where: { categoryId: category.id } })}`);
  
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
