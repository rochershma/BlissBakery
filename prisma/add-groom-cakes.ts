/**
 * Upload "Groom to Be" cake images to Cloudinary and insert products
 * Run: npx tsx prisma/add-groom-cakes.ts
 */
const { PrismaClient } = require("@prisma/client");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: (process.env.CLOUDINARY_API_SECRET || "").replace(/"/g, ""),
});

const db = new PrismaClient();

const IMAGE_DIR = "Q:\\src\\poc\\bakes\\WhatsApp Unknown 2026-06-12 at 17.52.49";
const OCCASION_ID = "occ_milestone_1780410915";
const CATEGORY_ID = "cmq2aide00001pvoou1f9tqu7"; // Occasion Cakes
const RECIPIENT_SLUG = "groom-to-be";
const OCCASION_SLUG = "special-milestones";

// Flavour prices (same as existing bride-to-be products)
const FLAVOUR_PRICES = [
  { name: "Chocochips", price500g: 550 },
  { name: "Hazelnut", price500g: 600 },
  { name: "Nutella", price500g: 600 },
  { name: "Belgian Chocolate", price500g: 650 },
  { name: "Almond Truffle", price500g: 650 },
  { name: "Truffle Dutch", price500g: 600 },
  { name: "Butterscotch", price500g: 550 },
  { name: "Salted Caramel", price500g: 650 },
  { name: "Red Velvet", price500g: 600 },
  { name: "Pineapple", price500g: 450 },
  { name: "Blueberry", price500g: 450 },
  { name: "Strawberry", price500g: 450 },
  { name: "Kesar Pista", price500g: 650 },
  { name: "Rose", price500g: 550 },
];
const FLAVOUR_NAMES = FLAVOUR_PRICES.map((f: any) => f.name);
const DEFAULT_FLAVOUR = "Blueberry";
const CHEAPEST_500G = 450; // Blueberry/Pineapple/Strawberry

// Serving info per weight
const SERVES: Record<string, string> = {
  "0.5": "Serves 4-6", "1": "Serves 8-10", "1.5": "Serves 12-15",
  "2": "Serves 18-20", "2.5": "Serves 22-25", "3": "Serves 28-30",
  "3.5": "Serves 32-35", "4": "Serves 38-40", "4.5": "Serves 42-45",
  "5": "Serves 48-50", "5.5": "Serves 52-55", "6": "Serves 58-60",
};

// Weight ranges for each type
function getWeights(type: string): number[] {
  switch (type) {
    case "single-not-tall": return [0.5, 1, 1.5, 2, 2.5, 3];
    case "single-tall": return [1, 1.5, 2, 2.5, 3, 3.5, 4];
    case "single-fondant-heavy": return [1, 1.5, 2, 2.5, 3, 3.5, 4];
    case "two-tier": return [1.5, 2, 2.5, 3, 3.5, 4, 5, 6];
    default: return [1, 1.5, 2, 2.5, 3, 3.5, 4];
  }
}

// Price = flavour500g * weightKg * 2 + designCharge
function calcPrice(weightKg: number, designCharge: number): number {
  return CHEAPEST_500G * weightKg * 2 + designCharge;
}

interface CakeSpec {
  file: string;
  name: string;
  slug: string;
  shortDesc: string;
  description: string;
  type: string;
  designCharge: number;
}

const cakes: CakeSpec[] = [
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.30 (1).jpeg",
    name: "Game Over Final Countdown Cake",
    slug: "game-over-final-countdown-cake",
    shortDesc: "Playful bachelor party cake with Game Over theme, couple toppers, fresh roses and pearls",
    description: "Send off the groom in style with this cheeky Game Over themed cake. Decorated with a bold retro-style Game Over banner, adorable couple cutout toppers, scattered pearl accents and gorgeous fresh pink and yellow roses, this cake is the ultimate bachelor party centerpiece. The smooth white buttercream finish adds elegance to the playful theme, making it a crowd favourite at any groom-to-be celebration. Ideal for stag nights, bachelor bashes and pre-wedding parties.",
    type: "single-fondant-heavy",
    designCharge: 399,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.30.jpeg",
    name: "Marble Tuxedo Suit Cake",
    slug: "marble-tuxedo-suit-cake",
    shortDesc: "Sophisticated grey marble tall cake with hand-painted tuxedo, gold and black spheres",
    description: "A strikingly sophisticated groom-to-be cake featuring a tall grey marble finish with a beautifully hand-painted black tuxedo suit holding a champagne glass. Accented with luxurious gold and black chocolate spheres and a sleek gold candle, this cake screams refined elegance. Perfect for classy bachelor parties, engagement celebrations, or groom shower events where you want a premium centrepiece that matches the groom's dapper style.",
    type: "single-tall",
    designCharge: 499,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.31 (1).jpeg",
    name: "Bride & Groom Fondant Couple Cake",
    slug: "bride-groom-fondant-couple-cake",
    shortDesc: "White textured cake with adorable fondant bride and groom figurines and chain detail",
    description: "This delightful groom-to-be cake features beautifully handcrafted fondant figurines of a bride and groom in a fun, playful pose. The textured white buttercream base, cute red heart accent and detailed fondant chain add character and charm to every slice of this celebration. A sweet and memorable choice for bachelor parties, couples' pre-wedding gatherings and groom shower celebrations that deserve a personal touch.",
    type: "single-fondant-heavy",
    designCharge: 449,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.31 (2).jpeg",
    name: "Groom To Be Gold Star Celebration Cake",
    slug: "groom-to-be-gold-star-celebration-cake",
    shortDesc: "White cake with golden Groom to Be text, Game Over plaque, couple cutout and glitter stars",
    description: "Celebrate the groom's last days of freedom with this charming white cake featuring golden Groom to Be lettering, a playful Game Over plaque in gold, adorable couple caricature cutout and sparkling glitter star toppers. The ridged buttercream texture, silver diamond accents and scattered pearls give this cake a festive, party-ready vibe. A wonderful choice for bachelor parties and pre-wedding celebrations.",
    type: "single-not-tall",
    designCharge: 249,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.31 (3).jpeg",
    name: "Game Over Silhouette Rose Cake",
    slug: "game-over-silhouette-rose-cake",
    shortDesc: "Minimalist white cake with Game Over silhouette topper and elegant white roses",
    description: "A beautifully understated groom-to-be cake featuring a swirled white buttercream finish, a striking black and gold Game Over silhouette topper showing a bride dragging the groom from his gaming chair, and a cluster of pristine white roses with fresh greenery. The contrast of the fun topper against the elegant cake design makes this a versatile choice for both casual stag parties and sophisticated pre-wedding celebrations.",
    type: "single-not-tall",
    designCharge: 199,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.31.jpeg",
    name: "Royal Navy Blue Tuxedo Cake",
    slug: "royal-navy-blue-tuxedo-cake",
    shortDesc: "Stunning tall navy blue fondant tuxedo cake with gold bow tie, buttons and spheres",
    description: "This showstopping tall cake is crafted entirely in rich navy blue fondant, designed to look like a perfectly tailored tuxedo with a crisp white shirt, gold buttons and a magnificent oversized gold fondant bow tie. Surrounded by luxurious gold chocolate spheres and delicate tulle at the base, this is one of our most premium groom-to-be designs. Ideal for upscale bachelor celebrations, engagement dinners or any pre-wedding event that calls for true elegance.",
    type: "single-tall",
    designCharge: 549,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.32 (1).jpeg",
    name: "Gentleman Cigar & Bow Tie Cake",
    slug: "gentleman-cigar-bow-tie-cake",
    shortDesc: "White fondant cake with red bow tie, cigar, mustache topper and Groom to Be script",
    description: "Raise a toast to the dapper groom with this fun and stylish cake. Featuring a smooth white fondant base adorned with a bold red fondant bow tie, black buttons, a realistic fondant cigar, curly mustache topper and a gorgeous gold glitter Groom to Be cake topper, this design captures the spirit of a gentleman's celebration. A crowd-pleasing choice for bachelor parties, groom showers and pre-wedding festivities.",
    type: "single-fondant-heavy",
    designCharge: 449,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.32 (2).jpeg",
    name: "Classic Groom To Be Tuxedo Cake",
    slug: "classic-groom-to-be-tuxedo-cake",
    shortDesc: "Elegant cream textured cake with fondant tuxedo front, black bow tie and mustache topper",
    description: "Simple, clean and undeniably stylish, this groom-to-be cake features a textured cream buttercream finish with a neatly crafted black and white fondant tuxedo front complete with bow tie and buttons. Topped with a Groom to Be mustache topper, this design is a timeless choice for any bachelor celebration. Its understated elegance makes it suitable for both intimate gatherings and larger pre-wedding parties.",
    type: "single-not-tall",
    designCharge: 249,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.32.jpeg",
    name: "Ivory Gold Tuxedo Boutonniere Cake",
    slug: "ivory-gold-tuxedo-boutonniere-cake",
    shortDesc: "Premium tall ivory fondant cake with blush lapels, gold bow tie, buttons and boutonniere",
    description: "A truly exquisite groom-to-be cake that doubles as a work of art. This tall cake is wrapped in smooth ivory fondant with blush pink tuxedo lapels, three gold buttons, a stunning oversized gold fondant bow tie and a delicate fondant boutonniere flower. Finished with a gold ribbon around the base, every detail speaks luxury and refinement. Perfect for upscale bachelor dinners, engagement celebrations and groom showers.",
    type: "single-tall",
    designCharge: 549,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.33 (1).jpeg",
    name: "Groom To Be Couple Leash Cake",
    slug: "groom-to-be-couple-leash-cake",
    shortDesc: "Tall cream cake with illustrated couple, gold pearls, black ribbon and Groom to Be topper",
    description: "A fun and lively groom-to-be tall cake with a smooth cream base decorated with a charming illustrated couple where the bride leads the groom on a playful leash. Gold pearl sprinkles cascade around the top, with a crisp black ribbon and bow at the base and an elegant black Groom to Be script topper. This design balances humour with style, making it perfect for fun-loving bachelor parties and pre-wedding celebrations.",
    type: "single-tall",
    designCharge: 399,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.33 (2).jpeg",
    name: "Groom To Be Rings Tuxedo Cake",
    slug: "groom-to-be-rings-tuxedo-cake",
    shortDesc: "Smooth white cake with tuxedo front, silver pearls, gold base and wedding rings topper",
    description: "A neat and charming groom-to-be cake featuring a smooth white buttercream finish dotted with silver pearl accents, a cleanly crafted black and white fondant tuxedo front with bow tie, and a fun Groom to Be topper with interlocking wedding rings. The gold base board and black ribbon add a touch of sophistication. An excellent choice for intimate bachelor parties and elegant pre-wedding celebrations.",
    type: "single-not-tall",
    designCharge: 299,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.33 (3).jpeg",
    name: "Indian Baraat Sherwani Groom Cake",
    slug: "indian-baraat-sherwani-groom-cake",
    shortDesc: "Tall cream cake with Indian groom in sherwani, dhol, shehnai, umbrella and rose toppers",
    description: "Celebrate the Indian groom in grand baraat style with this stunning tall cake. Decorated with a beautifully illustrated groom in a black sherwani, traditional baraat elements including a decorated umbrella, shehnai trumpets, dhol drum and jootis, plus fresh white roses and gold leaf accents. Finished with a Groom to Be bow tie topper and golden pearl sprinkles, this cake is perfect for Indian wedding celebrations, haldi ceremonies and desi bachelor parties.",
    type: "single-tall",
    designCharge: 449,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.33.jpeg",
    name: "Groom To Be Beer Toast Couple Cake",
    slug: "groom-to-be-beer-toast-couple-cake",
    shortDesc: "Tall cream cake with bride-groom illustration, gold sprinkles, black ribbon and beer topper",
    description: "Cheers to the groom with this fun and festive tall cake! Featuring a playful illustrated bride tying up the groom with a golden rope, cascading gold sprinkles, a sleek black satin ribbon with bow, and a unique Groom to Be topper with a beer mug silhouette. This lighthearted design is the life of the party and perfect for bachelor celebrations, boys' nights and pre-wedding gatherings with a fun twist.",
    type: "single-tall",
    designCharge: 399,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.34 (1).jpeg",
    name: "Gold Splatter Tuxedo Sphere Cake",
    slug: "gold-splatter-tuxedo-sphere-cake",
    shortDesc: "Textured white cake with gold splatter, tuxedo front, black and gold chocolate spheres",
    description: "A modern and trendy groom-to-be cake combining a textured white buttercream base with gold paint splatters, a sharp black and white fondant tuxedo front with bow tie, and clusters of black and gold chocolate spheres. The scattered white pearl accents complete the look. This contemporary design is perfect for stylish bachelor parties, modern groom showers and celebrations that call for something bold and eye-catching.",
    type: "single-tall",
    designCharge: 399,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.34 (2).jpeg",
    name: "Two Tier Tuxedo Groom Cake",
    slug: "two-tier-tuxedo-groom-cake",
    shortDesc: "Grand 2-tier black and white tuxedo cake with bow tie, buttons, roses and top hat topper",
    description: "Make a grand statement with this magnificent two-tier groom-to-be cake. Both tiers are dressed in smooth white fondant with sharp black tuxedo details including a bow tie, buttons, lapels and waistcoat accents. Fresh white roses with baby's breath adorn the side and a stylish Groom to Be top hat topper crowns the creation. This premium design is ideal for engagement parties, large bachelor celebrations and luxury pre-wedding events.",
    type: "two-tier",
    designCharge: 699,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.34.jpeg",
    name: "Two Tier Polka Dot Rose Groom Cake",
    slug: "two-tier-polka-dot-rose-groom-cake",
    shortDesc: "Elegant 2-tier white cake with polka dot ribbons, silver pearls, red roses and blazer topper",
    description: "A beautifully elegant two-tier groom-to-be cake featuring smooth white fondant tiers wrapped with black polka dot ribbons, scattered silver pearl accents and a dapper fondant blazer topper on top. The stunning arrangement of deep red roses with baby's breath adds romantic flair. Bold black Groom to Be lettering on the bottom tier makes the celebration unmistakable. Perfect for classy bachelor events, engagement dinners and premium pre-wedding parties.",
    type: "two-tier",
    designCharge: 699,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.35 (1).jpeg",
    name: "Gentleman Watch Drip Cake",
    slug: "gentleman-watch-drip-cake",
    shortDesc: "Tall cake with hand-painted watch and suit sleeve, black drip and monochrome spheres",
    description: "A sophisticated and artistic groom-to-be cake featuring a tall cream base with a stunning hand-painted watercolour illustration of a gentleman's wrist wearing a luxury watch, peeking out from a suit sleeve. Finished with dramatic black chocolate drip, a cluster of black and white chocolate spheres, and scattered pearl accents. This is a truly unique and premium design for the style-conscious groom, ideal for upscale bachelor parties and groom celebrations.",
    type: "single-tall",
    designCharge: 449,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.35 (2).jpeg",
    name: "Indian Groom Baraat Celebration Cake",
    slug: "indian-groom-baraat-celebration-cake",
    shortDesc: "Tall cream cake with Indian groom in sherwani, dhol, jootis, shehnai and wedding umbrella",
    description: "A vibrant celebration of Indian wedding traditions, this tall groom-to-be cake features a detailed illustrated Indian groom in a navy sherwani with golden buttons, surrounded by traditional baraat elements. Look for the decorated rajasthani umbrella, shehnai trumpets, dhol drum, embroidered jootis, fresh white roses and scattered gold pearls. Topped with a Groom to Be bow tie topper, this is the ultimate cake for desi bachelor parties, haldi functions and Indian pre-wedding celebrations.",
    type: "single-tall",
    designCharge: 449,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.35 (3).jpeg",
    name: "Chocolate Ombre Tuxedo Cake",
    slug: "chocolate-ombre-tuxedo-cake",
    shortDesc: "Tall chocolate brown ombre fondant cake with tuxedo design, bow tie, collar and piped border",
    description: "A rich and decadent groom-to-be cake wrapped in stunning chocolate brown ombre fondant that transitions from deep cocoa to warm caramel tones. The tuxedo design features a crisp white fondant collar, a chocolate brown bow tie and detailed buttons, all sitting above a beautifully piped chocolate rosette border. This warm-toned design stands out from the classic black and white options, making it perfect for chocolate-loving grooms and unique bachelor celebrations.",
    type: "single-tall",
    designCharge: 549,
  },
  {
    file: "WhatsApp Image 2026-06-12 at 17.49.35.jpeg",
    name: "Blue Watercolour Mustache Groom Cake",
    slug: "blue-watercolour-mustache-groom-cake",
    shortDesc: "White cake with blue watercolour brushstrokes, gold foil, mustache accent and gold spheres",
    description: "A fresh and modern groom-to-be cake featuring a smooth white base with artistic blue watercolour brushstrokes at the bottom, scattered gold foil flakes, a charming black fondant mustache, gold pearl accents and clusters of gorgeous gold chocolate spheres. A personalised Groom to Be fondant banner completes the design. This artistic and contemporary cake is perfect for modern bachelor parties, pool-side celebrations and fun pre-wedding events.",
    type: "single-fondant-heavy",
    designCharge: 349,
  },
];

async function uploadImage(filePath: string): Promise<string> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "blissbakery/products",
    transformation: { quality: "auto:best", fetch_format: "auto" },
    resource_type: "image",
  });
  return result.secure_url;
}

async function createProduct(cake: CakeSpec, imageUrl: string) {
  const weights = getWeights(cake.type);
  const basePrice = calcPrice(weights[0], cake.designCharge);

  // Create product
  const product = await db.product.create({
    data: {
      name: cake.name,
      slug: cake.slug,
      description: cake.description,
      shortDesc: cake.shortDesc,
      basePrice: basePrice,
      images: JSON.stringify([imageUrl]),
      isBestseller: false,
      isNew: false,
      isFeatured: false,
      isAvailable: true,
      occasions: JSON.stringify([OCCASION_SLUG]),
      forWhom: JSON.stringify([RECIPIENT_SLUG]),
      categoryId: CATEGORY_ID,
      flavours: JSON.stringify(FLAVOUR_NAMES),
      pricingStrategy: "CUSTOM",
      designCharge: cake.designCharge,
      base500gPrice: CHEAPEST_500G,
      flavourPrices: JSON.stringify(FLAVOUR_PRICES),
      defaultFlavour: DEFAULT_FLAVOUR,
    },
  });

  // Create variants (one per weight, using cheapest flavour price)
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    const price = calcPrice(w, cake.designCharge);
    await db.productVariant.create({
      data: {
        name: `${w} Kg`,
        price: price,
        isAvailable: true,
        sortOrder: i,
        productId: product.id,
        serves: SERVES[String(w)] || null,
      },
    });
  }

  return product;
}

async function main() {
  console.log(`Starting upload of ${cakes.length} Groom to Be cakes...\n`);

  for (let i = 0; i < cakes.length; i++) {
    const cake = cakes[i];
    const filePath = path.join(IMAGE_DIR, cake.file);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ SKIP: File not found: ${cake.file}`);
      continue;
    }

    console.log(`[${i + 1}/${cakes.length}] Uploading ${cake.name}...`);
    try {
      const imageUrl = await uploadImage(filePath);
      console.log(`  ✅ Cloudinary: ${imageUrl}`);

      const product = await createProduct(cake, imageUrl);
      const weights = getWeights(cake.type);
      const cheapestPrice = calcPrice(weights[0], cake.designCharge);
      console.log(`  ✅ Product: ${product.id} | Base: ₹${cheapestPrice} | Design: ₹${cake.designCharge} | Variants: ${weights.length}`);
    } catch (err: any) {
      console.log(`  ❌ Error: ${err.message}`);
    }
  }

  console.log("\n✅ Done! All groom-to-be cakes processed.");
  await db.$disconnect();
}

main().catch(console.error);
