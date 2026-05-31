import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const B = "/images/bakingo";

interface ProductSeed {
  name: string; slug: string; shortDesc: string; basePrice: number; mrpPrice?: number;
  images: string[]; catSlug: string;
  occasions: string[]; forWhom: string[];
  servingInfo?: string; isBestseller?: boolean; isNew?: boolean; isFeatured?: boolean;
}

const products: ProductSeed[] = [
  // ═══ CLASSIC CAKES ═══
  { name: "Rich Chocolate Truffle Cake", slug: "rich-choco-truffle", shortDesc: "Layers of rich chocolate sponge with luxurious truffle cream", basePrice: 549, images: [`${B}/choco-truffle-1.jpg`,`${B}/choco-truffle-2.jpg`,`${B}/choco-truffle-3.jpg`], catSlug: "cakes", occasions: ["birthday","celebration","anniversary"], forWhom: ["wife","husband","friend","kids"], servingInfo: "Serves 4-6", isBestseller: true },
  { name: "Rich Butterscotch Crunch Cake", slug: "rich-butterscotch-crunch", shortDesc: "Creamy butterscotch with crunchy praline topping", basePrice: 529, images: [`${B}/butterscotch-1.jpg`,`${B}/butterscotch-2.jpg`,`${B}/butterscotch-c.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["dad","friend","kids"], servingInfo: "Serves 4-6", isBestseller: true },
  { name: "Classic Black Forest Cake", slug: "classic-black-forest", shortDesc: "Chocolate sponge with cherries and whipped cream", basePrice: 549, images: [`${B}/blackforest-a.jpg`,`${B}/blackforest-b.jpg`,`${B}/blackforest-c.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["friend","kids","dad"], servingInfo: "Serves 4-6", isBestseller: true },
  { name: "Whipped Cream Pineapple Cake", slug: "whipped-pineapple", shortDesc: "Fresh pineapple pieces with cream on soft sponge", basePrice: 549, images: [`${B}/pineapple-a.jpg`,`${B}/pineapple-b.jpg`,`${B}/pineapple-c.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["mom","dad","friend"], servingInfo: "Serves 4-6" },
  { name: "Red Velvet Choco Truffle Cake", slug: "rv-choco-truffle", shortDesc: "Red velvet sponge with chocolate truffle cream", basePrice: 599, images: [`${B}/redvelvet-choco-a.jpg`], catSlug: "cakes", occasions: ["birthday","anniversary","valentine"], forWhom: ["wife","husband","her"], servingInfo: "Serves 4-6" },
  { name: "Ferrero Infused Celebration Cake", slug: "ferrero-celebration", shortDesc: "Premium chocolate cake topped with Ferrero Rocher", basePrice: 779, mrpPrice: 899, images: [`${B}/ferrero-1.jpg`,`${B}/ferrero-2.jpg`,`${B}/ferrero-c.jpg`], catSlug: "cakes", occasions: ["birthday","anniversary","gift"], forWhom: ["wife","husband","mom"], servingInfo: "Serves 6-8", isBestseller: true },
  { name: "Tropical Fruit & Almond Cake", slug: "tropical-fruit-almond", shortDesc: "Fresh seasonal fruits with almond on vanilla cream", basePrice: 649, images: [`${B}/fruitcake-a.jpg`,`${B}/fruitcake-b.jpg`,`${B}/fruitcake-c.jpg`], catSlug: "cakes", occasions: ["birthday","celebration","gift"], forWhom: ["mom","dad"], servingInfo: "Serves 4-6", isBestseller: true },
  { name: "Chocolate Vanilla Half & Half", slug: "choco-vanilla-half", shortDesc: "Best of both worlds in one cake", basePrice: 549, images: [`${B}/chocovanilla-a.jpg`,`${B}/chocovanilla-b.jpg`,`${B}/chocovanilla-c.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["kids","friend"], servingInfo: "Serves 4-6" },
  { name: "Roll Up Chocolate Truffle Cake", slug: "rollup-choco-truffle", shortDesc: "Swirled chocolate design with truffle cream", basePrice: 549, images: [`${B}/chocorollup-a.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["husband","friend","him"], servingInfo: "Serves 4-6" },
  { name: "Rose Petals & Pistachio Rasmalai Cake", slug: "rasmalai-pista-cake", shortDesc: "Indian fusion rasmalai cream with crushed pistachios", basePrice: 675, images: [`${B}/rasmalai-a.jpg`,`${B}/rasmalai-b.jpg`,`${B}/rasmalai-c.jpg`], catSlug: "cakes", occasions: ["birthday","festival","celebration"], forWhom: ["mom","dad","wife"], servingInfo: "Serves 6-8", isNew: true },
  { name: "Blueberry Cheesecake", slug: "blueberry-cheesecake-premium", shortDesc: "Creamy NY-style cheesecake with blueberry compote", basePrice: 779, images: [`${B}/blueberry-a.jpg`,`${B}/blueberry-b.jpg`,`${B}/blueberry-c.jpg`], catSlug: "cakes", occasions: ["anniversary","gift"], forWhom: ["wife","her"], servingInfo: "Serves 4-6" },
  { name: "Belgian Chocolate Mousse Cake", slug: "belgian-choco-mousse", shortDesc: "Premium Belgian dark chocolate mousse layers", basePrice: 649, mrpPrice: 749, images: [`${B}/belgianchoco-a.jpg`,`${B}/belgianchoco-b.jpg`,`${B}/belgianchoco-c.jpg`], catSlug: "cakes", occasions: ["birthday","anniversary","gift"], forWhom: ["husband","wife","friend"], servingInfo: "Serves 4-6" },
  { name: "Choco Dream Cake", slug: "choco-dream-gourmet", shortDesc: "Triple-layer chocolate extravaganza", basePrice: 649, mrpPrice: 699, images: [`${B}/chocodream-a.jpg`,`${B}/chocodream-b.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["friend","husband","wife"], servingInfo: "Serves 4-6" },
  { name: "Velvet Chocolate Truffle Cake", slug: "velvet-choco-truffle", shortDesc: "Smooth velvety chocolate truffle finish", basePrice: 549, images: [`${B}/velvetchoco-a.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["friend","him","her"], servingInfo: "Serves 4-6" },
  { name: "Choco Chip Truffle Cake", slug: "choco-chip-truffle", shortDesc: "Chocolate chips studded in truffle cream", basePrice: 549, images: [`${B}/chocochip-a.jpg`,`${B}/chocochip-b.jpg`,`${B}/chocochip-c.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["kids","friend"], servingInfo: "Serves 4-6", isBestseller: true },
  { name: "German Black Forest Cake", slug: "german-black-forest", shortDesc: "Authentic German-style with dark chocolate and cherries", basePrice: 559, images: [`${B}/germanforest-a.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["dad","friend","him"], servingInfo: "Serves 4-6" },
  { name: "Chocolate Loaded Glazed Cake", slug: "choco-loaded-glaze", shortDesc: "Glazed chocolate cake loaded with toppings", basePrice: 649, images: [`${B}/chocoglaze-a.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["husband","friend","him"], servingInfo: "Serves 4-6" },
  { name: "Mirror Glaze Choco Truffle Cake", slug: "mirror-glaze-choco", shortDesc: "Stunning mirror glaze finish on chocolate truffle", basePrice: 775, images: [`${B}/mirrorglaze-a.jpg`], catSlug: "cakes", occasions: ["birthday","anniversary"], forWhom: ["wife","husband"], servingInfo: "Serves 4-6" },
  { name: "Silky Drip Chocolate Cake", slug: "silky-drip-choco", shortDesc: "Smooth chocolate with beautiful drip design", basePrice: 549, images: [`${B}/silkydrip-a.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["friend","him","her"], servingInfo: "Serves 4-6", isNew: true },
  { name: "Milk Choco Indulgent Cake", slug: "milk-choco-indulgent", shortDesc: "Tall, premium milk chocolate cake with ganache", basePrice: 1099, images: [`${B}/milkchoco-a.jpg`], catSlug: "cakes", occasions: ["birthday","anniversary","gift"], forWhom: ["wife","husband"], servingInfo: "Serves 6-8", isFeatured: true },

  // ═══ KITKAT CAKES ═══
  { name: "KitKat Chocolate Truffle Cake", slug: "kitkat-truffle-classic", shortDesc: "KitKat wafers around rich chocolate truffle", basePrice: 649, images: [`${B}/kitkat-a.jpg`,`${B}/kitkat-b.jpg`,`${B}/kitkat-c.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["kids","friend","him"], servingInfo: "Serves 4-6", isBestseller: true },
  { name: "KitKat Swirls Drip Cake", slug: "kitkat-swirls-drip", shortDesc: "Drip design with KitKat swirls", basePrice: 599, images: [`${B}/kitkatswirl-a.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["kids","friend"], servingInfo: "Serves 4-6", isNew: true },
  { name: "Crunchy Choco KitKat Cake", slug: "crunchy-kitkat", shortDesc: "Extra crunchy KitKat layers with chocolate", basePrice: 699, images: [`${B}/kitkatcrunch-a.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["kids","him","friend"], servingInfo: "Serves 4-6" },

  // ═══ HEART-SHAPED / LOVE CAKES ═══
  { name: "Rosy Petals Heart Cake", slug: "rosy-petals-heart", shortDesc: "Heart-shaped cake with rose petal decorations", basePrice: 749, images: [`${B}/rosy-heart-1.jpg`,`${B}/rosy-heart-2.jpg`], catSlug: "occasion-cakes", occasions: ["anniversary","valentine","birthday"], forWhom: ["wife","husband","her","him"], servingInfo: "Serves 4-6", isBestseller: true },
  { name: "Red Velvet Heart Shape Cake", slug: "rv-heart-shape", shortDesc: "Heart-shaped red velvet with cream cheese frosting", basePrice: 799, images: [`${B}/red-velvet-heart-1.jpg`,`${B}/red-velvet-heart-2.jpg`], catSlug: "occasion-cakes", occasions: ["anniversary","valentine","birthday"], forWhom: ["wife","husband","her","him"], servingInfo: "Serves 4-6" },
  { name: "Heart Red Velvet Cake", slug: "heart-red-velvet-bloom", shortDesc: "Blooming red velvet with floral decorations", basePrice: 599, images: [`${B}/red-velvet-bloom-1.jpg`], catSlug: "occasion-cakes", occasions: ["birthday","anniversary","valentine"], forWhom: ["wife","her","mom"], servingInfo: "Serves 4-6" },
  { name: "Rosey Heart Choco Truffle Cake", slug: "rosey-heart-choco", shortDesc: "Heart-shaped chocolate truffle with rose design", basePrice: 749, images: [`${B}/chocoheart-a.jpg`], catSlug: "occasion-cakes", occasions: ["anniversary","valentine"], forWhom: ["wife","husband","her","him"], servingInfo: "Serves 4-6" },
  { name: "Hearts of Love Chocolate Cake", slug: "hearts-love-choco", shortDesc: "Round chocolate cake with heart decorations", basePrice: 749, images: [`${B}/choclove-a.jpg`], catSlug: "occasion-cakes", occasions: ["anniversary","valentine","birthday"], forWhom: ["wife","husband"], servingInfo: "Serves 4-6" },
  { name: "Romantic Love U Hearts Cake", slug: "romantic-love-hearts", shortDesc: "Designer cake with love hearts decoration", basePrice: 799, images: [`${B}/lovehearts-a.jpg`], catSlug: "occasion-cakes", occasions: ["valentine","anniversary"], forWhom: ["wife","husband","her","him"], servingInfo: "Serves 4-6", isNew: true },
  { name: "Chocolate Cake With Love Topper", slug: "choco-love-topper", shortDesc: "Truffle cake with elegant love topper", basePrice: 599, images: [`${B}/choclovetopper-a.jpg`], catSlug: "occasion-cakes", occasions: ["anniversary","valentine","birthday"], forWhom: ["wife","husband","her","him"], servingInfo: "Serves 4-6", isBestseller: true },
  { name: "Red Velvet Heart Love Topper Cake", slug: "rv-heart-love-topper", shortDesc: "Red velvet heart with love topper decoration", basePrice: 739, images: [`${B}/rvheartlove-a.jpg`], catSlug: "occasion-cakes", occasions: ["anniversary","valentine"], forWhom: ["wife","husband"], servingInfo: "Serves 4-6" },
  { name: "Heart Shape Double Delight Cake", slug: "heart-double-delight", shortDesc: "Heart-shaped half chocolate half white forest", basePrice: 649, images: [`${B}/heartforest-a.jpg`], catSlug: "occasion-cakes", occasions: ["anniversary","valentine","birthday"], forWhom: ["wife","husband","her","him"], servingInfo: "Serves 4-6" },
  { name: "Love Hearts Anniversary Pineapple", slug: "love-hearts-pine-anni", shortDesc: "Heart-decorated pineapple cake for anniversaries", basePrice: 599, images: [`${B}/annipine-a.jpg`], catSlug: "occasion-cakes", occasions: ["anniversary"], forWhom: ["wife","husband","mom","dad"], servingInfo: "Serves 4-6" },
  { name: "Happy Anniversary Pineapple Cake", slug: "happy-anni-pine", shortDesc: "Heart-shaped pineapple cream cake", basePrice: 549, images: [`${B}/heartpine-a.jpg`], catSlug: "occasion-cakes", occasions: ["anniversary"], forWhom: ["wife","husband","mom","dad"], servingInfo: "Serves 4-6" },

  // ═══ BIRTHDAY SPECIAL ═══
  { name: "Rosette Birthday Cake", slug: "rosette-birthday-vanilla", shortDesc: "Elegant vanilla rosette design with birthday topper", basePrice: 549, images: [`${B}/rosette-a.jpg`], catSlug: "cakes", occasions: ["birthday"], forWhom: ["wife","mom","her","friend"], servingInfo: "Serves 4-6" },
  { name: "Birthday Classic Black Forest", slug: "bday-classic-bf", shortDesc: "Birthday special black forest with star topper", basePrice: 599, images: [`${B}/bdayforest-a.jpg`], catSlug: "cakes", occasions: ["birthday"], forWhom: ["friend","kids","him","her"], servingInfo: "Serves 4-6" },
  { name: "Delightful Butterscotch Birthday Cake", slug: "bday-butterscotch", shortDesc: "Butterscotch birthday special with crunchy topping", basePrice: 549, images: [`${B}/butterbday-a.jpg`], catSlug: "cakes", occasions: ["birthday"], forWhom: ["dad","friend","kids"], servingInfo: "Serves 4-6" },
  { name: "Chocolate Truffle Drip Cake", slug: "choco-truffle-drip", shortDesc: "Drip design chocolate truffle with birthday topper", basePrice: 599, images: [`${B}/chocodrip-a.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["friend","him","her"], servingInfo: "Serves 4-6" },
  { name: "Rosette Chocolate Cake", slug: "rosette-chocolate", shortDesc: "Swirled chocolate rosette design", basePrice: 649, images: [`${B}/rosechoco-a.jpg`], catSlug: "cakes", occasions: ["birthday"], forWhom: ["wife","her","friend"], servingInfo: "Serves 4-6" },
  { name: "Fresh Fruits Topped Red Velvet", slug: "rv-fruits-topped", shortDesc: "Red velvet cake adorned with fresh seasonal fruits", basePrice: 799, images: [`${B}/redvelvetfruit-a.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["wife","mom","her"], servingInfo: "Serves 4-6" },
  { name: "Pink & Orange Red Velvet Cake", slug: "pink-orange-rv", shortDesc: "Drip design red velvet in pink & orange hues", basePrice: 689, images: [`${B}/redvelvetdrip-a.jpg`], catSlug: "cakes", occasions: ["birthday"], forWhom: ["wife","her","mom","friend"], servingInfo: "Serves 4-6" },

  // ═══ PREMIUM / GOURMET ═══
  { name: "Choco Ferrero Birthday Drip Cake", slug: "ferrero-drip-cake", shortDesc: "Premium drip cake topped with Ferrero Rocher", basePrice: 1649, mrpPrice: 1749, images: [`${B}/ferrerdrip-a.jpg`], catSlug: "cakes", occasions: ["birthday","anniversary","gift"], forWhom: ["wife","husband"], servingInfo: "Serves 6-8", isFeatured: true },
  { name: "Glazed German Black Forest", slug: "glazed-german-bf", shortDesc: "Premium glazed German-style black forest", basePrice: 599, images: [`${B}/germanbf-a.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["dad","husband","friend"], servingInfo: "Serves 4-6" },
  { name: "Butterscotch Crunch Designer", slug: "butterscotch-crunch-designer", shortDesc: "Designer butterscotch with crunchy layers", basePrice: 549, images: [`${B}/buttercrunch-a.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["dad","friend","kids"], servingInfo: "Serves 4-6" },
  { name: "Red Velvet Elegance Cake", slug: "rv-elegance", shortDesc: "Elegant red velvet with cream cheese and sprinkles", basePrice: 649, images: [`${B}/rvelegance-a.jpg`], catSlug: "cakes", occasions: ["birthday","anniversary"], forWhom: ["wife","her","mom"], servingInfo: "Serves 4-6", isNew: true },
  { name: "Tropical Pineapple Cake", slug: "tropical-pineapple-premium", shortDesc: "Tropical pineapple with cream and decorations", basePrice: 549, images: [`${B}/tropicalpine-a.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["mom","dad","friend"], servingInfo: "Serves 4-6" },
  { name: "Choco Vanilla Delight Cake", slug: "choco-vanilla-delight", shortDesc: "Elegant chocolate and vanilla layered cake", basePrice: 549, images: [`${B}/chocovanilladelight-a.jpg`], catSlug: "cakes", occasions: ["birthday","celebration"], forWhom: ["friend","kids","her","him"], servingInfo: "Serves 4-6" },

  // ═══ DESIGNER CAKES ═══
  { name: "Jungle Paradise Theme Cake", slug: "jungle-paradise-theme", shortDesc: "Fondant jungle animals — lion, elephant, giraffe", basePrice: 1499, images: [`${B}/jungle-a.jpg`], catSlug: "designer-cakes", occasions: ["birthday"], forWhom: ["kids"], servingInfo: "Serves 8-10", isBestseller: true },
  { name: "Pink Princess Barbie Cake", slug: "pink-princess-barbie", shortDesc: "Stunning Barbie doll cake for princesses", basePrice: 1479, images: [`${B}/barbie-a.jpg`,`${B}/barbie-b.jpg`], catSlug: "designer-cakes", occasions: ["birthday"], forWhom: ["kids","her"], servingInfo: "Serves 10-12", isBestseller: true },
  { name: "Rose N Butterfly Designer Cake", slug: "rose-butterfly-designer", shortDesc: "Elegant roses and butterflies in fondant", basePrice: 1429, images: [`${B}/rosebutterfly-a.jpg`,`${B}/rosebutterfly-b.jpg`,`${B}/rosebutterfly-c.jpg`], catSlug: "designer-cakes", occasions: ["birthday","anniversary"], forWhom: ["wife","mom","her"], servingInfo: "Serves 8-10" },
  { name: "Spider Man Adventure Cake", slug: "spiderman-adventure", shortDesc: "Spiderman themed fondant cake for superhero fans", basePrice: 1299, images: [`${B}/spiderman-a.jpg`], catSlug: "designer-cakes", occasions: ["birthday"], forWhom: ["kids","him"], servingInfo: "Serves 8-10" },
  { name: "Starry Unicorn Cake", slug: "starry-unicorn", shortDesc: "Magical unicorn with stars and rainbow colors", basePrice: 1659, images: [`${B}/unicorn-a.jpg`], catSlug: "designer-cakes", occasions: ["birthday"], forWhom: ["kids","her"], servingInfo: "Serves 8-10" },
  { name: "Superheroes Chocolate Drips Cake", slug: "superheroes-drip", shortDesc: "Avengers themed drip cake with superhero toppers", basePrice: 1559, images: [`${B}/superhero-a.jpg`], catSlug: "designer-cakes", occasions: ["birthday"], forWhom: ["kids","him"], servingInfo: "Serves 8-10" },
  { name: "Happy Birthday Bear Cake", slug: "hbd-teddy-bear", shortDesc: "Adorable teddy bear themed cream cake", basePrice: 1249, images: [`${B}/teddybear-a.jpg`], catSlug: "designer-cakes", occasions: ["birthday"], forWhom: ["kids","her"], servingInfo: "Serves 8-10" },
  { name: "Cricket Theme Birthday Cake", slug: "cricket-theme-bday", shortDesc: "Cricket kit and pitch design for cricket lovers", basePrice: 1019, images: [`${B}/cricket-a.jpg`], catSlug: "designer-cakes", occasions: ["birthday"], forWhom: ["him","kids","husband","dad"], servingInfo: "Serves 6-8" },
  { name: "Beautiful Butterfly Theme Cake", slug: "butterfly-theme", shortDesc: "Pastel butterflies and flowers design", basePrice: 1429, images: [`${B}/butterfly-a.jpg`], catSlug: "designer-cakes", occasions: ["birthday","celebration"], forWhom: ["wife","her","mom","kids"], servingInfo: "Serves 8-10" },
  { name: "Pastel Paradise Birthday Cake", slug: "pastel-paradise-bday", shortDesc: "Stunning pastel multi-layer design cake", basePrice: 2199, images: [`${B}/pastelparadise-a.jpg`], catSlug: "designer-cakes", occasions: ["birthday","wedding"], forWhom: ["wife","her"], servingInfo: "Serves 15-20", isFeatured: true },
  { name: "King Kohli RCB Cricket Cake", slug: "kohli-cricket-cake", shortDesc: "RCB themed cake for cricket fans", basePrice: 1599, images: [`${B}/kohli-a.jpg`], catSlug: "designer-cakes", occasions: ["birthday"], forWhom: ["him","kids","husband"], servingInfo: "Serves 8-10", isNew: true },
  { name: "Pink N Blue Baby Shower Cake", slug: "baby-shower-theme", shortDesc: "Gender reveal / baby shower themed cake", basePrice: 729, images: [`${B}/babyshower-a.jpg`], catSlug: "designer-cakes", occasions: ["celebration"], forWhom: ["her","wife"], servingInfo: "Serves 6-8" },
  { name: "Jungle Safari Cream Cake", slug: "jungle-safari-cream", shortDesc: "Safari themed cream cake with cute animals", basePrice: 1389, images: [`${B}/junglesafari-a.jpg`], catSlug: "designer-cakes", occasions: ["birthday"], forWhom: ["kids"], servingInfo: "Serves 8-10" },
  { name: "Mischievous Monkey Cake", slug: "monkey-fondant-cake", shortDesc: "Adorable monkey fondant cake for kids", basePrice: 1569, images: [`${B}/monkeycake-a.jpg`], catSlug: "designer-cakes", occasions: ["birthday"], forWhom: ["kids"], servingInfo: "Serves 8-10" },
  { name: "Silky Pink Bow Cake", slug: "pink-bow-bridal", shortDesc: "Elegant pink bow design for celebrations", basePrice: 1569, images: [`${B}/pinkbow-a.jpg`], catSlug: "designer-cakes", occasions: ["birthday","wedding","celebration"], forWhom: ["wife","her","mom"], servingInfo: "Serves 8-10" },

  // ═══ WEDDING CAKES ═══
  { name: "Grooves N Blooms Ivory Cake", slug: "ivory-floral-2tier", shortDesc: "Elegant 2-tier white floral wedding cake", basePrice: 2639, images: [`${B}/weddingfloral-a.jpg`], catSlug: "occasion-cakes", occasions: ["wedding","engagement"], forWhom: ["wife","husband"], servingInfo: "Serves 20-25", isFeatured: true },
];

async function main() {
  console.log("🌱 Seeding massive product catalog...");
  const store = await prisma.store.findFirst();
  if (!store) { console.log("No store!"); return; }

  // Get category IDs
  const cats = await prisma.category.findMany();
  const catMap: Record<string, string> = {};
  cats.forEach(c => catMap[c.slug] = c.id);

  let created = 0, updated = 0;
  for (const p of products) {
    const catId = catMap[p.catSlug];
    if (!catId) { console.log(`  SKIP: no category '${p.catSlug}'`); continue; }

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      await prisma.product.update({
        where: { slug: p.slug },
        data: {
          images: JSON.stringify(p.images),
          occasions: JSON.stringify(p.occasions),
          forWhom: JSON.stringify(p.forWhom),
          servingInfo: p.servingInfo || null,
          mrpPrice: p.mrpPrice || null,
          isBestseller: p.isBestseller || false,
          isNew: p.isNew || false,
          isFeatured: p.isFeatured || false,
        },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: {
          name: p.name, slug: p.slug, shortDesc: p.shortDesc, basePrice: p.basePrice,
          mrpPrice: p.mrpPrice || null,
          images: JSON.stringify(p.images),
          categoryId: catId,
          occasions: JSON.stringify(p.occasions),
          forWhom: JSON.stringify(p.forWhom),
          servingInfo: p.servingInfo || null,
          isBestseller: p.isBestseller || false,
          isNew: p.isNew || false,
          isFeatured: p.isFeatured || false,
          isAvailable: true,
        },
      });
      created++;

      // Add standard variants for cakes
      if (p.catSlug.includes("cake")) {
        const prod = await prisma.product.findUnique({ where: { slug: p.slug } });
        if (prod) {
          const vc = await prisma.productVariant.count({ where: { productId: prod.id } });
          if (vc === 0) {
            await prisma.productVariant.createMany({
              data: [
                { name: "500g", price: p.basePrice, sortOrder: 1, productId: prod.id },
                { name: "1 kg", price: Math.round(p.basePrice * 1.8), sortOrder: 2, productId: prod.id },
                { name: "2 kg", price: Math.round(p.basePrice * 3.2), sortOrder: 3, productId: prod.id },
              ],
            });
          }
        }
      }
    }
  }

  console.log(`✅ Catalog seeded: ${created} created, ${updated} updated. Total: ${created + updated}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
