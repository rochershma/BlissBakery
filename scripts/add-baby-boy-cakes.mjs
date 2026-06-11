/**
 * Upload Welcome Baby Boy cakes to Cloudinary + Create products in DB.
 * Each image = 1 product, under Occasion "Special Milestones" → Recipient "Welcome Baby Boy"
 * 
 * Usage: node scripts/add-baby-boy-cakes.mjs
 */
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import { readdirSync } from "fs";
import { join } from "path";

cloudinary.config({
  cloud_name: "dvw9o0f8z",
  api_key: "792441267859941",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const db = new PrismaClient();
const IMG_DIR = "Q:/src/poc/bakes/WhatsApp Unknown 2026-06-11 at 17.22.22";

// Product names + descriptions based on visual review of images
const PRODUCTS = [
  { file: "WhatsApp Image 2026-06-11 at 16.17.19.jpeg", name: "Welcome Home Baby Boy Cake", desc: "A dreamy sky-blue buttercream cake adorned with a balloon arch, a cute baby figurine, a gold 'Oh Baby' topper, a tiny stroller, and a baby bottle. Perfect for celebrating the arrival of your little prince." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.20 (1).jpeg", name: "Starry Night Baby Boy Cake", desc: "An elegant powder-blue cake featuring a sleeping baby on fluffy clouds, golden stars, angel wings, and delicate pearl accents. A heavenly welcome for your newborn." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.20 (2).jpeg", name: "Twinkle Little Star Baby Boy Cake", desc: "A charming blue cake topped with sparkling gold stars, white clouds, and a sweet sleeping baby. The crescent moon and twinkling details make it a magical centrepiece for a baby shower." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.20.jpeg", name: "Baby Boy Birth Details Cake", desc: "A pastel blue cake beautifully decorated with cloud toppers showing the baby's birth date, weight, and time. Features a sleeping baby illustration, golden spheres, a pacifier, and a tiny stroller — a perfect keepsake cake." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.21 (1).jpeg", name: "Blue Elephant Baby Boy Cake", desc: "A soft blue cake with an adorable baby elephant on top, fluffy clouds, tiny stars, and golden accents. A gentle and playful design perfect for welcoming a newborn boy." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.21 (2).jpeg", name: "Sleeping Angel Baby Boy Cake", desc: "A heavenly blue cake with a sleeping baby angel surrounded by wings, golden stars, white clouds, and pearl decorations. Ideal for a christening or baby naming ceremony." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.21.jpeg", name: "Teddy Bear Rainbow Baby Boy Cake", desc: "An elegant cream-toned cake featuring a cuddly teddy bear with a bow tie, pastel rainbow arches, alphabet blocks, a wooden ladder, and golden star wands. A whimsical design for a baby boy celebration." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.22 (1).jpeg", name: "Blue Sky Teddy Bear Baby Cake", desc: "A soothing sky-blue cake topped with a lovable teddy bear, fluffy clouds, tiny stars, and soft balloon accents. A warm and cuddly welcome for the newest member of your family." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.22 (2).jpeg", name: "Blue Balloons Baby Boy Cake", desc: "A vibrant blue cake decorated with blue and white chocolate balloons, gold leaf accents, and a cheerful 'Oh Baby' topper. A trendy and modern design for a baby boy celebration." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.22 (3).jpeg", name: "Pastel Clouds Baby Boy Cake", desc: "A delicate pastel blue cake adorned with white clouds, gentle pearl sprinkles, and a sweet baby figurine. A minimalist yet stunning cake for a newborn baby boy celebration." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.22.jpeg", name: "Oh Boy Pampas Grass Cake", desc: "A stylish baby blue cake with gold foil accents, blue and white chocolate spheres, dried pampas grass, and a stunning 'Oh Boy' topper. A contemporary boho-inspired design for modern parents." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.23 (1).jpeg", name: "Dreamy Clouds Welcome Baby Cake", desc: "A smooth blue fondant cake featuring a sleeping newborn on clouds, golden stars and pram, angel wings, and a bold 'WELCOME' message. A showstopper cake for welcoming your baby boy home." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.23 (2).jpeg", name: "Celestial Baby Boy Welcome Cake", desc: "A sky-blue cake with a cute baby figurine surrounded by stars, clouds, a golden moon, and pastel balloon decorations. A celestial-themed centrepiece for a newborn celebration." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.23.jpeg", name: "Welcome Starry Baby Boy Cake", desc: "A beautifully crafted blue cake with a sleeping baby on clouds, shimmering gold stars, angel wings, a golden pram, and a 'WELCOME' banner. An angelic cake for your little blessing." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.24 (1).jpeg", name: "Baby Shower Stork Cake", desc: "A whimsical cake featuring a stork carrying a baby, fluffy clouds, colourful balloons, and a 'Baby Boy' banner. A classic and heartwarming design for a baby shower celebration." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.24 (2).jpeg", name: "Blue Floral Baby Boy Cake", desc: "An elegant white and blue two-tier cake decorated with delicate sugar flowers, butterflies, and a cute baby boy figurine. A refined and graceful cake for a sophisticated celebration." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.24.jpeg", name: "It's A Boy Two-Tier Cake", desc: "A grand two-tier baby shower cake in white and blue fondant with tiny shoes, a teddy bear, a pram, gift boxes, stars, balloons, and an 'It's A Boy' message. The ultimate showpiece for welcoming your baby boy." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.25 (1).jpeg", name: "Teddy In Clouds Baby Boy Cake", desc: "A serene mint-green cake with a sweet teddy bear peeking from behind clouds, tiny stars, and soft pearl accents. A calming and adorable design perfect for a newborn welcome party." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.25 (2).jpeg", name: "Little Prince Baby Boy Cake", desc: "A royal blue cake crowned with a tiny golden crown, a sleeping baby prince figurine, gold drip accents, and sparkling stars. Fit for celebrating the arrival of your little prince." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.25.jpeg", name: "Baby Boy Blocks & Teddy Cake", desc: "A gentle mint-green cake featuring a teddy bear with a bow tie, alphabet blocks spelling 'BABY', fluffy clouds, and delicate pearl sprinkles. A timeless and endearing design for a baby boy celebration." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.26 (1).jpeg", name: "Blue Bow Baby Boy Cake", desc: "A soft blue cake with a golden pacifier, tiny baby shoes, a cute romper decoration, and a delicate white bow. A sweet and simple design that captures the joy of a newborn arrival." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.26 (2).jpeg", name: "Ruffles & Bow Baby Boy Two-Tier Cake", desc: "A stunning two-tier cake with a smooth blue fondant top tier, textured white and blue ombre ruffles on the bottom, a sleeping baby figurine, a satin white bow, and 'BABY BOY' lettering. An absolute showstopper." },
  { file: "WhatsApp Image 2026-06-11 at 16.17.26.jpeg", name: "Blue Moon Baby Boy Cake", desc: "A dreamy blue cake with a crescent moon, twinkling stars, tiny clouds, and a sleeping baby. Adorned with pearl details and pastel accents — a magical cake for celebrating your little one." },
];

async function main() {
  if (!process.env.CLOUDINARY_API_SECRET) { console.error("Set CLOUDINARY_API_SECRET!"); process.exit(1); }

  // 1. Create/find "Welcome Baby Boy" recipient under "Special Milestones"
  const occasion = await db.occasion.findFirst({ where: { slug: "special-milestones" } });
  if (!occasion) { console.error("Special Milestones occasion not found!"); return; }
  
  let recipient = await db.recipient.findFirst({ where: { slug: "welcome-baby-boy", occasionId: occasion.id } });
  if (!recipient) {
    const maxOrder = await db.recipient.aggregate({ where: { occasionId: occasion.id }, _max: { sortOrder: true } });
    recipient = await db.recipient.create({
      data: { name: "Welcome Baby Boy", slug: "welcome-baby-boy", sortOrder: (maxOrder._max.sortOrder || 0) + 1, occasionId: occasion.id },
    });
    console.log("Created recipient: Welcome Baby Boy");
  }
  
  // 2. Get store config for pricing
  const store = await db.store.findFirst();
  const category = await db.category.findFirst({ where: { slug: { startsWith: "occasion-cakes" } } });
  if (!category) { console.error("Occasion Cakes category not found!"); return; }
  
  const defaultFlavours = (() => { try { return JSON.parse(store.defaultFlavours || "[]"); } catch { return []; } })();
  const defaultFlavourPrices = (() => { try { return JSON.parse(store.defaultFlavourPrices || "[]"); } catch { return []; } })();
  const defaultSizes = (() => { try { return JSON.parse(store.defaultCustomSizes || "[]"); } catch { return []; } })();
  
  const DESIGN_CHARGE = 300;
  const cheapest500g = defaultFlavourPrices.length > 0 ? Math.min(...defaultFlavourPrices.map(fp => fp.price500g)) : 450;
  
  console.log(`Flavours: ${defaultFlavours.length}, Sizes: ${defaultSizes.length}, Cheapest: ₹${cheapest500g}/500g`);
  
  // 3. Upload and create each product
  let created = 0;
  for (const p of PRODUCTS) {
    const filePath = join(IMG_DIR, p.file);
    process.stdout.write(`  ${p.name}...`);
    
    // Check if already exists
    const existing = await db.product.findFirst({ where: { name: p.name } });
    if (existing) { console.log(" EXISTS"); continue; }
    
    // Upload to Cloudinary (full quality, no compression)
    let cdnUrl;
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "blissbakery/occasions/welcome-baby-boy",
        quality: 100,
        format: "jpg",
      });
      cdnUrl = result.secure_url;
    } catch (e) {
      console.log(` CDN FAIL: ${e.message?.slice(0, 50)}`);
      continue;
    }
    
    // Create variants
    const sizeConfigs = defaultSizes.length > 0 ? defaultSizes : [
      { kg: 0.5, name: "0.5 Kg", serves: "Serves 4-6" },
      { kg: 1, name: "1 Kg", serves: "Serves 8-10" },
      { kg: 1.5, name: "1.5 Kg", serves: "Serves 12-15" },
      { kg: 2, name: "2 Kg", serves: "Serves 18-20" },
    ];
    
    // Filter out 250gm/7kg bogus entry
    const validSizes = sizeConfigs.filter(s => s.kg <= 6 && s.name !== "250 gm");
    
    const variants = validSizes.map((size, i) => ({
      name: size.name,
      price: Math.round(cheapest500g * (size.kg || 0.5) * 2 + DESIGN_CHARGE),
      serves: size.serves || null,
      sortOrder: i,
      isAvailable: true,
    }));
    
    const basePrice = variants.length > 0 ? variants[0].price : Math.round(cheapest500g + DESIGN_CHARGE);
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
    
    await db.product.create({
      data: {
        name: p.name,
        slug,
        shortDesc: "Welcome baby boy celebration cake — 100% eggless, freshly baked",
        description: p.desc,
        basePrice,
        images: JSON.stringify([cdnUrl]),
        categoryId: category.id,
        isBestseller: false,
        isNew: true,
        isAvailable: true,
        occasions: JSON.stringify(["special-milestones"]),
        forWhom: JSON.stringify(["welcome-baby-boy"]),
        themes: JSON.stringify([]),
        themeTags: JSON.stringify([]),
        flavours: JSON.stringify(defaultFlavours),
        pricingStrategy: "CUSTOM",
        flavourPrices: JSON.stringify(defaultFlavourPrices),
        designCharge: DESIGN_CHARGE,
        base500gPrice: cheapest500g,
        defaultFlavour: "Pineapple",
        variants: { create: variants },
      },
    });
    
    created++;
    console.log(` OK (₹${basePrice})`);
  }
  
  console.log(`\nDone: ${created} products created`);
  console.log(`Browse: /cakes/special-milestones?for=welcome-baby-boy`);
  
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
