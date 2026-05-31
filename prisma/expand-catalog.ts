/**
 * Comprehensive Bakingo catalog expansion script
 * Downloads HD images + seeds products with proper tagging
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

const db = new PrismaClient();
const BAKINGO_CDN = "https://bkmedia.bakingo.com";
const IMG_DIR = path.join(__dirname, "..", "public", "images", "bakingo");

// ---- HELPER: Download image ----
function download(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
      resolve(true); // already downloaded
      return;
    }
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location!, (r2) => { r2.pipe(file); file.on("finish", () => { file.close(); resolve(true); }); })
          .on("error", () => resolve(false));
        return;
      }
      if (res.statusCode !== 200) { file.close(); fs.unlinkSync(dest); resolve(false); return; }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(true); });
    }).on("error", () => resolve(false));
  });
}

// ---- PRODUCT DEFINITIONS ----
// Each product: name, slug prefix, category, price, images (CDN paths), occasions, forWhom, variants
interface ProductDef {
  name: string;
  slug: string;
  category: "cakes" | "designer-cakes" | "occasion-cakes";
  price: number;
  mrp?: number;
  description?: string;
  servingInfo?: string;
  images: string[]; // CDN filenames
  occasions: string[];
  forWhom: string[];
  isBestseller?: boolean;
  isNew?: boolean;
  variants: { name: string; price: number }[];
}

const STD_VARIANTS = [
  { name: "500g", price: 0 }, // placeholder - will use base price
  { name: "1 kg", price: 0 },
  { name: "1.5 kg", price: 0 },
  { name: "2 kg", price: 0 },
];

function makeVariants(base: number): { name: string; price: number }[] {
  return [
    { name: "500g", price: base },
    { name: "1 kg", price: Math.round(base * 1.8) },
    { name: "1.5 kg", price: Math.round(base * 2.5) },
    { name: "2 kg", price: Math.round(base * 3.2) },
  ];
}

// ==== NEW OCCASION CAKES ====
const NEW_PRODUCTS: ProductDef[] = [
  // --- BIRTHDAY THEMED ---
  {
    name: "Rosette Birthday Cake",
    slug: "rosette-birthday-cake",
    category: "occasion-cakes",
    price: 549,
    description: "Elegant rosette-patterned cake topped with a birthday topper. Perfect for celebrations.",
    servingInfo: "Serves 6-8",
    images: ["vanilla-rosette-birthday-cake-cake4034vani-AA.jpg", "vanilla-rosette-birthday-cake-cake4034vani-BB.jpg", "vanilla-rosette-birthday-cake-cake4034vani-VV.jpg"],
    occasions: ["birthday", "celebration"],
    forWhom: ["for-wife", "for-mom", "for-friend", "for-her"],
    isBestseller: true,
    variants: makeVariants(549),
  },
  {
    name: "Chocolate Truffle Drip Cake",
    slug: "chocolate-truffle-drip-cake",
    category: "occasion-cakes",
    price: 599,
    description: "Rich chocolate truffle cake with stunning chocolate drip design and birthday topper.",
    servingInfo: "Serves 6-8",
    images: ["dreamy-chocolate-cake-cake4053choc-b_0.jpg", "dreamy-chocolate-cake-cake4053choc-a_0.jpg", "dreamy-chocolate-cake-cake4053choc-c_0.jpg"],
    occasions: ["birthday", "celebration"],
    forWhom: ["for-husband", "for-dad", "for-him", "for-friend"],
    variants: makeVariants(599),
  },
  {
    name: "Rosette Chocolate Birthday Cake",
    slug: "rosette-chocolate-birthday",
    category: "occasion-cakes",
    price: 649,
    description: "Gorgeous chocolate rosette cake with premium cocoa frosting and happy birthday topper.",
    servingInfo: "Serves 6-8",
    images: ["rosy-swirls-chocolate-cake-cake4035choc-a.jpg", "rosy-swirls-chocolate-cake-cake4035choc-b.jpg", "rosy-swirls-chocolate-cake-cake4035choc-c.jpg"],
    occasions: ["birthday", "celebration"],
    forWhom: ["for-wife", "for-husband", "for-friend"],
    variants: makeVariants(649),
  },
  {
    name: "Butterscotch Birthday Delight",
    slug: "butterscotch-birthday-delight",
    category: "occasion-cakes",
    price: 549,
    description: "Delightful butterscotch cake adorned with caramelized nuts and a birthday topper.",
    servingInfo: "Serves 6-8",
    images: ["nutty-butterscotch-bliss-cake4047butt-AA.jpg", "nutty-butterscotch-bliss-cake4047butt-BB.jpg", "nutty-butterscotch-bliss-cake4047butt-CC.jpg"],
    occasions: ["birthday", "celebration"],
    forWhom: ["for-kids", "for-mom", "for-dad", "for-friend"],
    isBestseller: true,
    variants: makeVariants(549),
  },
  {
    name: "Oreo Chocolate Drip Cake",
    slug: "oreo-chocolate-drip",
    category: "occasion-cakes",
    price: 1449,
    description: "Decadent chocolate cake loaded with Oreo cookies, chocolate drip and premium toppings.",
    servingInfo: "Serves 8-10",
    images: ["oreo-chocolate-drip-cake-cake3968choc-a.jpg", "oreo-chocolate-drip-cake-cake3968choc-c.jpg", "oreo-chocolate-drip-cake-cake3968choc-c_0.jpg"],
    occasions: ["birthday", "celebration"],
    forWhom: ["for-kids", "for-husband", "for-him", "for-friend"],
    isNew: true,
    variants: makeVariants(1449),
  },
  {
    name: "Chocolate Ganache Truffle Cake",
    slug: "chocolate-ganache-truffle",
    category: "cakes",
    price: 549,
    description: "Smooth chocolate ganache layered cake with a luscious truffle finish.",
    servingInfo: "Serves 6-8",
    images: ["sq-round-shaped-chocolate-cake-2-cake0654choc-AA_0.jpg", "sq-round-shaped-chocolate-cake-2-cake0654choc-AE.jpg", "sq-round-shaped-chocolate-cake-2-cake0654choc-BB.jpg"],
    occasions: ["birthday", "anniversary", "celebration"],
    forWhom: ["for-wife", "for-husband", "for-friend"],
    variants: makeVariants(549),
  },
  {
    name: "Roll Up Chocolate Truffle Cake",
    slug: "roll-up-chocolate-truffle",
    category: "cakes",
    price: 549,
    description: "Classic round chocolate truffle with chocolate roll-up curls on top.",
    servingInfo: "Serves 6-8",
    images: ["sq-round-shaped-chocolate-cake-1-cake0653choc-AA.jpg", "sq-round-shaped-chocolate-cake-1-cake0653choc-BB.jpg", "sq-round-shaped-chocolate-cake-1-cake0653choc-CC.jpg"],
    occasions: ["birthday", "celebration"],
    forWhom: ["for-husband", "for-dad", "for-him"],
    isBestseller: true,
    variants: makeVariants(549),
  },
  {
    name: "Roses Topped Vanilla Cream Cake",
    slug: "roses-vanilla-cream",
    category: "occasion-cakes",
    price: 1149,
    description: "Premium vanilla cream cake adorned with hand-crafted cream roses. Elegant and romantic.",
    servingInfo: "Serves 8-10",
    images: ["sq-round-pink-roses-vanilla-cake-rosecake2561vani-AAAA_0.jpg", "sq-round-pink-roses-vanilla-cake-rosecake2561vani-BBBB.jpg", "sq-round-pink-roses-vanilla-cake-rosecake2561vani-CCCC.jpg"],
    occasions: ["birthday", "anniversary", "wedding"],
    forWhom: ["for-wife", "for-mom", "for-her"],
    variants: makeVariants(1149),
  },
  // --- ANNIVERSARY ---
  {
    name: "Golden Anniversary Heart Cake",
    slug: "golden-anniversary-heart",
    category: "occasion-cakes",
    price: 899,
    description: "Heart-shaped golden anniversary cake with elegant cream rosettes.",
    servingInfo: "Serves 6-8",
    images: ["heart-shaped-red-velvet-cake-cake1095redv-AAAAA.jpg", "heart-shaped-red-velvet-cake-cake1095redv-BBBBB.jpg", "heart-shaped-red-velvet-cake-cake1095redv-CCCCC.jpg"],
    occasions: ["anniversary", "valentine"],
    forWhom: ["for-wife", "for-husband", "for-her", "for-him"],
    variants: makeVariants(899),
  },
  // --- DESIGNER / THEME ---
  {
    name: "Superheroes Chocolate Drip Cake",
    slug: "superheroes-chocolate-drip",
    category: "designer-cakes",
    price: 1559,
    description: "Action-packed superhero themed chocolate drip cake for little heroes.",
    servingInfo: "Serves 10-12",
    images: ["superheroes-chocolate-drip-cake-them4865flav-A.jpg", "superheroes-chocolate-drip-cake-them4865flav-B.jpg", "superheroes-chocolate-drip-cake-them4865flav-C.jpg"],
    occasions: ["birthday"],
    forWhom: ["for-kids", "for-him"],
    isNew: true,
    variants: makeVariants(1559),
  },
  {
    name: "Picture Perfect Camera Cake",
    slug: "picture-perfect-camera-cake",
    category: "designer-cakes",
    price: 1289,
    description: "Unique camera-themed birthday cake for photography lovers.",
    servingInfo: "Serves 8-10",
    images: ["picture-perfect-birthday-polaroid-cake-them5424flav-A.jpg", "picture-perfect-birthday-polaroid-cake-them5424flav-B.jpg", "picture-perfect-birthday-polaroid-cake-them5424flav-C.jpg"],
    occasions: ["birthday"],
    forWhom: ["for-friend", "for-her", "for-him"],
    variants: makeVariants(1289),
  },
  {
    name: "Pastel Paradise Designer Cake",
    slug: "pastel-paradise-designer",
    category: "designer-cakes",
    price: 2199,
    description: "Stunning multi-tier pastel paradise cake with premium fondant work.",
    servingInfo: "Serves 15-20",
    images: ["pastel-paradise-birthday-cake-bg-them3872flav-A_0.jpg", "pastel-paradise-birthday-cake-bg-them3872flav-B_0.jpg", "pastel-paradise-birthday-cake-bg-them3872flav-C_0.jpg"],
    occasions: ["birthday", "wedding"],
    forWhom: ["for-wife", "for-her", "for-kids"],
    variants: makeVariants(2199),
  },
  {
    name: "KitKat Bars Premium Cake",
    slug: "kitkat-bars-premium",
    category: "occasion-cakes",
    price: 649,
    description: "Loaded KitKat bars cake with chocolate gems and M&Ms topping.",
    servingInfo: "Serves 6-8",
    images: ["kitkat-bars-cake-cake5332kikat-A.jpg", "kitkat-bars-cake-cake5332kikat-B.jpg", "kitkat-bars-cake-cake5332kikat-C.jpg", "kitkat-bars-cake-cake5332kikat-D.jpg"],
    occasions: ["birthday", "celebration"],
    forWhom: ["for-kids", "for-friend", "for-him"],
    variants: makeVariants(649),
  },
  {
    name: "Barbie Dream Dessert Cake",
    slug: "barbie-dream-dessert",
    category: "designer-cakes",
    price: 1659,
    description: "Magical Barbie-themed fondant cake that every little princess dreams of.",
    servingInfo: "Serves 10-12",
    images: ["stylish-fondant-barbie-cake-them3715flav-AA.jpg", "stylish-fondant-barbie-cake-them3715flav-BB.jpg", "stylish-fondant-barbie-cake-them3715flav-CC.jpg"],
    occasions: ["birthday"],
    forWhom: ["for-kids", "for-her"],
    variants: makeVariants(1659),
  },
  {
    name: "Mischievous Monkey Cake",
    slug: "mischievous-monkey-cake",
    category: "designer-cakes",
    price: 1569,
    description: "Adorable fondant monkey cake perfect for jungle-themed birthday parties.",
    servingInfo: "Serves 10-12",
    images: ["round-shaped-fondant-cake-them958flav-A_1.jpg", "round-shaped-fondant-cake-them958flav-B_1.jpg", "round-shaped-fondant-cake-them958flav-C_1.jpg"],
    occasions: ["birthday"],
    forWhom: ["for-kids"],
    variants: makeVariants(1569),
  },
  {
    name: "Cutesy First Birthday Cake",
    slug: "cutesy-first-birthday",
    category: "occasion-cakes",
    price: 689,
    description: "Adorable first birthday cake with cute decorations for your little one's special day.",
    servingInfo: "Serves 6-8",
    images: ["cutesy-one-year-bday-cake-photo2724flav-A_1.jpg", "cutesy-one-year-bday-cake-photo2724flav-C_1.jpg", "cutesy-one-year-bday-cake-photo2724flav-B_1.jpg"],
    occasions: ["birthday"],
    forWhom: ["for-kids"],
    isNew: true,
    variants: makeVariants(689),
  },
  {
    name: "Happy Birthday Dinosaur Cake",
    slug: "happy-birthday-dinosaur",
    category: "designer-cakes",
    price: 689,
    description: "Fun dinosaur-themed photo cake for little explorers and dino-lovers.",
    servingInfo: "Serves 6-8",
    images: ["playful-dinosaur-photo-cake-phot3809flav-AAA_0.jpg", "playful-dinosaur-photo-cake-phot3809flav-BBB_0.jpg", "playful-dinosaur-photo-cake-phot3809flav-CCC_0.jpg"],
    occasions: ["birthday"],
    forWhom: ["for-kids", "for-him"],
    variants: makeVariants(689),
  },
  {
    name: "Classic At Forty Birthday Cake",
    slug: "classic-at-forty",
    category: "occasion-cakes",
    price: 689,
    description: "Elegant milestone birthday cake celebrating the big 40.",
    servingInfo: "Serves 6-8",
    images: ["classic-at-forty-birthday-cake-phot5534flav-A.jpg", "classic-at-forty-birthday-cake-phot5534flav-B.jpg", "classic-at-forty-birthday-cake-phot5534flav-C.jpg"],
    occasions: ["birthday", "celebration"],
    forWhom: ["for-husband", "for-wife", "for-friend"],
    variants: makeVariants(689),
  },
  {
    name: "Cheers To Fifty Milestone Cake",
    slug: "cheers-to-fifty",
    category: "occasion-cakes",
    price: 689,
    description: "Celebrate half a century with this gorgeous milestone birthday cake.",
    servingInfo: "Serves 6-8",
    images: ["cheers-to-fifty-birthday-cake-phot5536flav-A_0.jpg", "cheers-to-fifty-birthday-cake-phot5536flav-B.jpg", "cheers-to-fifty-birthday-cake-phot5536flav-C.jpg"],
    occasions: ["birthday", "celebration", "retirement"],
    forWhom: ["for-dad", "for-mom", "for-husband", "for-wife"],
    variants: makeVariants(689),
  },
  {
    name: "Insta King Eighteenth Birthday Cake",
    slug: "insta-king-eighteenth",
    category: "occasion-cakes",
    price: 689,
    description: "Trendy Instagram-themed 18th birthday cake for the social media generation.",
    servingInfo: "Serves 6-8",
    images: ["insta-king-eighteenth-photo-birthday-cake-phot5533flav-A.jpg", "insta-king-eighteenth-photo-birthday-cake-phot5533flav-B.jpg", "insta-king-eighteenth-photo-birthday-cake-phot5533flav-C.jpg"],
    occasions: ["birthday"],
    forWhom: ["for-kids", "for-friend", "for-her", "for-him"],
    isNew: true,
    variants: makeVariants(689),
  },
  {
    name: "Special Six Birthday Cake",
    slug: "special-six-birthday",
    category: "occasion-cakes",
    price: 1329,
    description: "Themed number cake celebrating the special age of six.",
    servingInfo: "Serves 8-10",
    images: ["special-six-birthday-cake-them3867flav-A_0.jpg", "special-six-birthday-cake-them3867flav-B_0.jpg", "special-six-birthday-cake-them3867flav-C_0.jpg"],
    occasions: ["birthday"],
    forWhom: ["for-kids"],
    isNew: true,
    variants: makeVariants(1329),
  },
  // --- RETIREMENT / LIFE STAGE ---
  {
    name: "Happy Retirement Celebration Cake",
    slug: "happy-retirement-celebration",
    category: "occasion-cakes",
    price: 799,
    description: "Elegant retirement cake to celebrate a lifetime of achievements.",
    servingInfo: "Serves 8-10",
    images: ["cheers-to-fifty-birthday-cake-phot5536flav-A_0.jpg", "cheers-to-fifty-birthday-cake-phot5536flav-B.jpg"],
    occasions: ["retirement", "celebration"],
    forWhom: ["for-dad", "for-mom"],
    variants: makeVariants(799),
  },
  // --- CHOCO FERRERO PREMIUM ---
  {
    name: "Choco Ferrero Premium Drip Cake",
    slug: "choco-ferrero-premium-drip",
    category: "occasion-cakes",
    price: 1649,
    mrp: 1749,
    description: "Premium Ferrero Rocher topped drip cake with gold accents.",
    servingInfo: "Serves 10-12",
    images: ["choco-ferrero-cake-cake4741ferr-A.jpg", "choco-ferrero-cake-cake4741ferr-B.jpg", "choco-ferrero-cake-cake4741ferr-C.jpg"],
    occasions: ["birthday", "anniversary", "celebration"],
    forWhom: ["for-wife", "for-husband", "for-friend"],
    variants: makeVariants(1649),
  },
];

async function main() {
  const store = await db.store.findFirst();
  if (!store) throw new Error("No store");

  // Get category IDs
  const categories = await db.category.findMany();
  const catMap: Record<string, string> = {};
  categories.forEach(c => { catMap[c.slug] = c.id; });

  console.log("=== Step 1: Download images ===");
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of NEW_PRODUCTS) {
    for (const imgFile of product.images) {
      const localName = imgFile.replace(/[^a-zA-Z0-9._-]/g, "_");
      const localPath = path.join(IMG_DIR, localName);
      const url = `${BAKINGO_CDN}/${imgFile}`;

      if (fs.existsSync(localPath) && fs.statSync(localPath).size > 5000) {
        skipped++;
        continue;
      }

      const ok = await download(url, localPath);
      if (ok && fs.existsSync(localPath) && fs.statSync(localPath).size > 5000) {
        downloaded++;
        process.stdout.write(".");
      } else {
        failed++;
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        console.log(`  FAIL: ${imgFile}`);
      }
    }
  }
  console.log(`\nDownloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}`);

  console.log("\n=== Step 2: Seed products ===");
  let created = 0;
  let existed = 0;

  for (const p of NEW_PRODUCTS) {
    // Check if product already exists
    const existing = await db.product.findFirst({ where: { slug: { startsWith: p.slug } } });
    if (existing) {
      existed++;
      continue;
    }

    const categoryId = catMap[p.category];
    if (!categoryId) {
      console.log(`  SKIP: No category '${p.category}'`);
      continue;
    }

    // Build image paths (only include those that downloaded successfully)
    const imagePaths: string[] = [];
    for (const imgFile of p.images) {
      const localName = imgFile.replace(/[^a-zA-Z0-9._-]/g, "_");
      const localPath = path.join(IMG_DIR, localName);
      if (fs.existsSync(localPath) && fs.statSync(localPath).size > 5000) {
        imagePaths.push(`/images/bakingo/${localName}`);
      }
    }

    if (imagePaths.length === 0) {
      console.log(`  SKIP: No images for '${p.name}'`);
      continue;
    }

    const product = await db.product.create({
      data: {
        name: p.name,
        slug: p.slug + "-" + Date.now().toString(36),
        description: p.description || null,
        basePrice: p.price,
        mrpPrice: p.mrp || null,
        servingInfo: p.servingInfo || null,
        images: JSON.stringify(imagePaths),
        occasions: JSON.stringify(p.occasions),
        forWhom: JSON.stringify(p.forWhom),
        isBestseller: p.isBestseller || false,
        isNew: p.isNew || false,
        isFeatured: false,
        isAvailable: true,
        categoryId,
      },
    });

    // Create variants
    if (p.variants.length > 0) {
      await db.productVariant.createMany({
        data: p.variants.map((v, i) => ({
          productId: product.id,
          name: v.name,
          price: v.price,
          sortOrder: i,
        })),
      });
    }

    created++;
    console.log(`  ✅ ${p.name} (${imagePaths.length} imgs, ${p.variants.length} variants)`);
  }

  console.log(`\nCreated: ${created}, Already existed: ${existed}`);

  // === Step 3: Recategorize existing products ===
  console.log("\n=== Step 3: Recategorize existing ===");

  // Move themed/designer products from "cakes" to "designer-cakes"
  const designerNames = [
    "Pink Princess Barbie", "Superhero", "Spider", "Cricket", "Jungle Safari",
    "Monkey", "Teddy Bear", "Butterfly", "Unicorn", "Baby Shower",
    "Kohli", "Pastel Paradise", "Mirror Glaze", "Pink Bow"
  ];

  const occasionNames = [
    "Birthday", "Anniversary", "Wedding", "Valentine", "Rose N Butterfly",
    "Heart", "Love", "Retirement"
  ];

  const cakesCategory = catMap["cakes"];
  const designerCategory = catMap["designer-cakes"];
  const occasionCategory = catMap["occasion-cakes"];

  if (cakesCategory && designerCategory) {
    const cakeProducts = await db.product.findMany({ where: { categoryId: cakesCategory } });
    let moved = 0;
    for (const p of cakeProducts) {
      const isDesigner = designerNames.some(n => p.name.toLowerCase().includes(n.toLowerCase()));
      const isOccasion = occasionNames.some(n => p.name.toLowerCase().includes(n.toLowerCase()));

      if (isDesigner && designerCategory) {
        await db.product.update({ where: { id: p.id }, data: { categoryId: designerCategory } });
        console.log(`  → Designer: ${p.name}`);
        moved++;
      } else if (isOccasion && occasionCategory) {
        await db.product.update({ where: { id: p.id }, data: { categoryId: occasionCategory } });
        console.log(`  → Occasion: ${p.name}`);
        moved++;
      }
    }
    console.log(`Moved ${moved} products`);
  }

  // Final count
  const finalCounts = await db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
  console.log("\n=== Final Catalog ===");
  let total = 0;
  finalCounts.forEach(c => {
    if (c._count.products > 0) {
      console.log(`  ${c.name}: ${c._count.products}`);
      total += c._count.products;
    }
  });
  console.log(`  TOTAL: ${total}`);
}

main().catch(console.error).finally(() => db.$disconnect());
