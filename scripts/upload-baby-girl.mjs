/**
 * Step 1: Upload Welcome Baby Girl cake images to Cloudinary.
 */
import { v2 as cloudinary } from "cloudinary";
import { writeFileSync } from "fs";
import { join } from "path";

cloudinary.config({
  cloud_name: "dvw9o0f8z",
  api_key: "792441267859941",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMG_DIR = "Q:/src/poc/bakes/WhatsApp Unknown 2026-06-11 at 17.50.57";

const PRODUCTS = [
  { file: "WhatsApp Image 2026-06-11 at 17.50.44.jpeg", name: "Welcome Baby Butterfly Balloon Cake", desc: "A gorgeous blush-pink tall cake cascading with rose-gold and pink chocolate spheres, delicate pink butterflies with gold outlines, and a shimmering 'Welcome Baby' gold topper. A stunning and modern centrepiece for a baby girl celebration." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.44 (1).jpeg", name: "Pink Ruffles & Pearls Baby Girl Cake", desc: "A soft pink buttercream cake with elegant fondant ruffles, a dainty sleeping baby figurine, scattered pearl beads, and a satin pink bow. A classic and graceful design perfect for welcoming your little princess." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.44 (2).jpeg", name: "Pink Pram & Roses Baby Girl Cake", desc: "A beautiful white and pink cake topped with a fondant baby pram, sugar roses, tiny booties, and golden pearl accents. An elegant and timeless design for a baby girl's arrival celebration." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.44 (3).jpeg", name: "Pink Drip Teddy Bear Baby Girl Cake", desc: "A charming pink drip cake adorned with a cuddly teddy bear, a tiny baby bottle, pink booties, macarons, gold leaf, and a heart-shaped topper. A sweet and playful design for your baby girl." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.45.jpeg", name: "It's A Baby Girl Pram Cake", desc: "A stunning pink buttercream cake with a hand-crafted fondant pram topper in pink and gold, an 'It's A Baby Girl' plaque, white sugar roses, and delicate pearl sprinkles. A showstopper for a baby shower." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.45 (1).jpeg", name: "Pink Hearts Cloud Baby Girl Cake", desc: "A soft pink ombre cake with fluffy white clouds, sparkling pink hearts, golden stars, and a crescent moon. A dreamy celestial theme for welcoming your newborn girl." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.45 (2).jpeg", name: "Pink Carousel Baby Girl Cake", desc: "An enchanting pastel pink cake featuring a beautiful carousel topper with horses, golden accents, pink canopy, and delicate pearl details. A magical design fit for a little princess." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.46.jpeg", name: "Oh Baby Rose Pram Drip Cake", desc: "An ivory cream cake with a pink chocolate drip, a pink fondant pram topper with golden details, dried rose buds, a satin pink bow, and a gleaming 'Oh Baby!' gold lettering. A refined and romantic baby girl cake." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.46 (1).jpeg", name: "Rose Gold Tiered Baby Girl Cake", desc: "A luxurious two-tier pink and white fondant cake with rose-gold drip, pink chocolate spheres, sugar bows, and sparkling accents. An opulent and statement-making cake for a grand baby shower." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.46 (2).jpeg", name: "Pretty In Pink Baby Girl Cake", desc: "A tall blush-pink cake with a floral fondant wreath, a sweet sleeping baby girl figurine, gold accents, and scattered sugar pearls. An ethereal and delicate design for celebrating your new arrival." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.46 (3).jpeg", name: "Pink Clouds & Stars Baby Girl Cake", desc: "A pastel pink cake with fluffy white fondant clouds, golden stars, a crescent moon, and a sleeping baby figurine. A celestial dream for a baby naming ceremony or newborn celebration." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.47.jpeg", name: "Baby Girl Birth Details Cake", desc: "A white and pink ombre cake decorated with personalised flower-shaped fondant toppers spelling the baby's name, a sleeping baby figurine with birth details, a pink blanket, and a weight tag. A keepsake cake to treasure." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.47 (1).jpeg", name: "Pink Elephant Baby Girl Cake", desc: "A soft pink buttercream cake with an adorable fondant baby elephant wearing a pink bow, golden stars, white clouds, and scattered pearls. A gentle and whimsical design for a baby girl celebration." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.47 (2).jpeg", name: "Baby Girl Romper & Shoes Cake", desc: "A sweet pink cake adorned with tiny fondant baby shoes, a romper, a pacifier, building blocks, and pink heart decorations. A charming and heartfelt celebration cake for a newborn baby girl." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.48.jpeg", name: "Baby Girl Pram Keepsake Cake", desc: "A pristine white cake topped with a pink fondant pram, birth details toppers showing time and weight, a calendar, a measuring tape, and a 'Baby Girl' name banner with golden lettering. A personalised keepsake cake." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.48 (1).jpeg", name: "Floral Wreath Baby Girl Cake", desc: "An elegant ivory cake surrounded by a lush fondant floral wreath of pink roses and green leaves, with a delicate pink bow and a sleeping baby figurine on top. A garden-inspired masterpiece for a baby girl." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.48 (2).jpeg", name: "Pink Ombre Rosette Baby Girl Cake", desc: "A striking pink ombre rosette-piped buttercream cake with a fondant baby girl figurine, tiny shoes, and a delicate satin bow. A textured and visually rich cake for a baby shower celebration." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.49.jpeg", name: "Pink Teddy & Hearts Baby Girl Cake", desc: "A soft pink cake with a cuddly fondant teddy bear, scattered hearts, a polka-dot bow, and 'Baby Girl' lettering. A cosy and heartwarming design perfect for a newborn welcome party." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.49 (1).jpeg", name: "Pink Bunny Baby Girl Cake", desc: "A delightful pastel pink cake featuring a cute fondant bunny, a 'Welcome Baby' banner, tiny hearts, and soft pink drip accents. An adorable and playful cake for a baby girl's arrival." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.49 (2).jpeg", name: "Sleeping Baby Princess Cake", desc: "A royal pink cake with a sleeping baby girl figurine dressed in a tiny princess outfit, golden crown accents, pink drip, and sparkling sugar pearls. A regal welcome for your little princess." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.49 (3).jpeg", name: "Pink Butterfly Garden Baby Girl Cake", desc: "A whimsical pink buttercream cake adorned with delicate sugar butterflies, pink roses, green fondant leaves, and golden pearl accents. A garden of joy for celebrating a baby girl's birth." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.50.jpeg", name: "Pink Stork Baby Girl Cake", desc: "A charming white and pink cake featuring a fondant stork carrying a baby, fluffy clouds, colourful balloons, pink drip, and a 'Welcome Baby Girl' banner. A heartwarming classic design." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.50 (1).jpeg", name: "Pink Swan Baby Girl Cake", desc: "An elegant white cake with a graceful pink fondant swan, delicate sugar flowers, golden leaf accents, and a soft pink drip. A sophisticated and swan-themed celebration cake for a baby girl." },
  { file: "WhatsApp Image 2026-06-11 at 17.50.50 (2).jpeg", name: "Pink Balloon Arch Baby Girl Cake", desc: "A festive pink cake topped with a fondant balloon arch in pink, white, and gold, tiny baby booties, a star topper, and scattered pearls. A celebration-ready cake for your new baby girl." },
];

async function main() {
  if (!process.env.CLOUDINARY_API_SECRET) { console.error("Set CLOUDINARY_API_SECRET!"); process.exit(1); }
  const results = [];
  let ok = 0;
  for (const p of PRODUCTS) {
    process.stdout.write(`  ${p.name}...`);
    try {
      const result = await cloudinary.uploader.upload(join(IMG_DIR, p.file), {
        folder: "blissbakery/occasions/welcome-baby-girl",
        quality: 100,
        format: "jpg",
      });
      results.push({ name: p.name, desc: p.desc, image: result.secure_url, bytes: result.bytes });
      ok++;
      console.log(` OK (${Math.round(result.bytes/1024)}KB)`);
    } catch (e) {
      console.log(` FAIL: ${e.message?.slice(0, 60)}`);
    }
  }
  writeFileSync("scripts/baby-girl-uploads.json", JSON.stringify(results, null, 2));
  console.log(`\nUploaded ${ok}/${PRODUCTS.length} → scripts/baby-girl-uploads.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
