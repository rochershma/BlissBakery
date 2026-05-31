import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding expanded product catalog...");

  const store = await prisma.store.findFirst();
  if (!store) { console.log("No store found!"); return; }

  // Get existing categories
  const cakes = await prisma.category.findUnique({ where: { slug: "cakes" } });
  const pastries = await prisma.category.findUnique({ where: { slug: "pastries" } });

  if (!cakes) { console.log("No cakes category!"); return; }

  // --- New Categories ---
  const designerCat = await prisma.category.upsert({
    where: { slug: "designer-cakes" },
    update: {},
    create: { name: "Designer Cakes", slug: "designer-cakes", sortOrder: 8, storeId: store.id },
  });
  const occasionCat = await prisma.category.upsert({
    where: { slug: "occasion-cakes" },
    update: {},
    create: { name: "Occasion Cakes", slug: "occasion-cakes", sortOrder: 9, storeId: store.id },
  });

  // --- New Products with Bakingo images ---
  const newProducts = [
    {
      name: "KitKat Chocolate Cake",
      slug: "kitkat-chocolate-cake",
      shortDesc: "Crunchy KitKat wafers around rich chocolate truffle cake",
      description: "A chocolate lover's paradise — rich truffle cake surrounded by crunchy KitKat wafer fingers, topped with chocolate ganache and KitKat chunks.",
      basePrice: 650,
      mrpPrice: 750,
      images: JSON.stringify(["/images/bakingo/kitkat-1.jpg", "/images/bakingo/kitkat-2.jpg"]),
      isBestseller: true, isFeatured: true,
      occasions: JSON.stringify(["birthday", "celebration"]),
      forWhom: JSON.stringify(["kids", "friend"]),
      servingInfo: "Serves 4-6 people",
      categoryId: cakes!.id,
    },
    {
      name: "Ferrero Rocher Cake",
      slug: "ferrero-rocher-cake",
      shortDesc: "Luxurious chocolate cake with Ferrero Rocher topping",
      description: "Premium chocolate sponge layered with hazelnut cream, topped with whole Ferrero Rocher chocolates and almond flakes. An indulgent celebration cake.",
      basePrice: 780,
      mrpPrice: 899,
      images: JSON.stringify(["/images/bakingo/ferrero-1.jpg", "/images/bakingo/ferrero-2.jpg"]),
      isBestseller: true,
      occasions: JSON.stringify(["anniversary", "birthday", "gift"]),
      forWhom: JSON.stringify(["wife", "husband", "mom"]),
      servingInfo: "Serves 6-8 people",
      categoryId: cakes!.id,
    },
    {
      name: "Chocolate Vanilla Half & Half",
      slug: "choco-vanilla-half-half",
      shortDesc: "Best of both worlds — chocolate and vanilla in one cake",
      basePrice: 550,
      images: JSON.stringify(["/images/bakingo/choco-vanilla-1.jpg"]),
      occasions: JSON.stringify(["birthday", "celebration"]),
      forWhom: JSON.stringify(["kids", "friend"]),
      servingInfo: "Serves 4-6 people",
      categoryId: cakes!.id,
    },
    {
      name: "Rasmalai Pista Cake",
      slug: "rasmalai-pista-cake",
      shortDesc: "Indian fusion — rasmalai cream with pistachio topping",
      description: "A unique fusion of rasmalai and cake. Soft sponge soaked in rasmalai syrup, layered with rasmalai cream, topped with crushed pistachios.",
      basePrice: 675,
      images: JSON.stringify(["/images/bakingo/rasmalai-1.jpg", "/images/bakingo/rasmalai-2.jpg"]),
      isNew: true,
      occasions: JSON.stringify(["festival", "celebration", "wedding"]),
      forWhom: JSON.stringify(["mom", "dad", "wife"]),
      servingInfo: "Serves 6-8 people",
      categoryId: cakes!.id,
    },
    {
      name: "Blueberry Cheesecake",
      slug: "blueberry-cheesecake",
      shortDesc: "Creamy New York cheesecake with blueberry compote",
      basePrice: 780,
      images: JSON.stringify(["/images/bakingo/blueberry-1.jpg"]),
      isNew: true,
      occasions: JSON.stringify(["anniversary", "gift"]),
      forWhom: JSON.stringify(["wife", "husband"]),
      servingInfo: "Serves 4-6 people",
      categoryId: cakes!.id,
    },
    {
      name: "Black Forest Cake",
      slug: "black-forest-cake",
      shortDesc: "Classic chocolate sponge with cherries and whipped cream",
      description: "Layers of moist chocolate sponge, whipped cream, and juicy cherries. Finished with chocolate shavings and cherry on top.",
      basePrice: 550,
      images: JSON.stringify(["/images/bakingo/black-forest-1.jpg", "/images/bakingo/black-forest-2.jpg"]),
      isBestseller: true,
      occasions: JSON.stringify(["birthday", "celebration"]),
      forWhom: JSON.stringify(["friend", "kids"]),
      servingInfo: "Serves 4-6 people",
      categoryId: cakes!.id,
    },
    {
      name: "Fruit Cake",
      slug: "tropical-fruit-cake",
      shortDesc: "Fresh seasonal fruits on vanilla cream cake",
      basePrice: 650,
      images: JSON.stringify(["/images/bakingo/fruit-cake-1.jpg"]),
      occasions: JSON.stringify(["birthday", "celebration", "gift"]),
      forWhom: JSON.stringify(["mom", "dad"]),
      servingInfo: "Serves 4-6 people",
      categoryId: cakes!.id,
    },
    {
      name: "Pineapple Cream Cake",
      slug: "pineapple-cream-cake",
      shortDesc: "Fresh pineapple pieces with cream on soft sponge",
      basePrice: 500,
      images: JSON.stringify(["/images/bakingo/pineapple-1.jpg"]),
      occasions: JSON.stringify(["birthday", "celebration"]),
      forWhom: JSON.stringify(["mom", "dad", "friend"]),
      servingInfo: "Serves 4-6 people",
      categoryId: cakes!.id,
    },
    // Designer Cakes
    {
      name: "Barbie Princess Cake",
      slug: "barbie-princess-cake",
      shortDesc: "Stunning Barbie doll cake perfect for little princesses",
      basePrice: 1500,
      images: JSON.stringify(["/images/bakingo/barbie-1.jpg"]),
      isFeatured: true,
      occasions: JSON.stringify(["birthday"]),
      forWhom: JSON.stringify(["kids"]),
      servingInfo: "Serves 15-20 people",
      categoryId: designerCat.id,
    },
    {
      name: "Chocolate Dream Cake",
      slug: "chocolate-dream-cake",
      shortDesc: "Triple-layer chocolate extravaganza with ganache drip",
      basePrice: 650,
      mrpPrice: 699,
      images: JSON.stringify(["/images/bakingo/choco-dream-1.jpg"]),
      occasions: JSON.stringify(["birthday", "celebration"]),
      forWhom: JSON.stringify(["friend", "husband", "wife"]),
      servingInfo: "Serves 4-6 people",
      categoryId: designerCat.id,
    },
    // Occasion Cakes
    {
      name: "Rosy Heart Cake",
      slug: "rosy-heart-cake",
      shortDesc: "Heart-shaped cake with rose petals — perfect for love",
      basePrice: 750,
      images: JSON.stringify(["/images/bakingo/rosy-heart-1.jpg"]),
      isFeatured: true,
      occasions: JSON.stringify(["anniversary", "valentine"]),
      forWhom: JSON.stringify(["wife", "husband"]),
      servingInfo: "Serves 4-6 people",
      categoryId: occasionCat.id,
    },
    {
      name: "Red Velvet Heart Cake",
      slug: "red-velvet-heart-cake",
      shortDesc: "Heart-shaped red velvet with cream cheese frosting",
      basePrice: 800,
      images: JSON.stringify(["/images/bakingo/red-velvet-heart-1.jpg", "/images/bakingo/red-velvet-heart-2.jpg"]),
      occasions: JSON.stringify(["anniversary", "valentine", "birthday"]),
      forWhom: JSON.stringify(["wife", "husband"]),
      servingInfo: "Serves 4-6 people",
      categoryId: occasionCat.id,
    },
    {
      name: "Red Velvet Bloom Cake",
      slug: "red-velvet-bloom-cake",
      shortDesc: "Elegant red velvet with floral decorations",
      basePrice: 600,
      images: JSON.stringify(["/images/bakingo/red-velvet-bloom-1.jpg"]),
      occasions: JSON.stringify(["birthday", "anniversary"]),
      forWhom: JSON.stringify(["wife", "mom"]),
      servingInfo: "Serves 4-6 people",
      categoryId: occasionCat.id,
    },
    {
      name: "Belgian Chocolate Cake",
      slug: "belgian-chocolate-cake",
      shortDesc: "Rich Belgian dark chocolate mousse cake",
      basePrice: 650,
      mrpPrice: 749,
      images: JSON.stringify(["/images/bakingo/belgian-choco-1.jpg"]),
      occasions: JSON.stringify(["birthday", "anniversary", "gift"]),
      forWhom: JSON.stringify(["husband", "friend"]),
      servingInfo: "Serves 4-6 people",
      categoryId: cakes!.id,
    },
  ];

  for (const p of newProducts) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { images: p.images, occasions: p.occasions, forWhom: p.forWhom, servingInfo: p.servingInfo, mrpPrice: p.mrpPrice || null },
      create: p,
    });
  }
  console.log(`   ✅ ${newProducts.length} products upserted`);

  // Add variants to new cakes
  for (const slug of ["kitkat-chocolate-cake", "ferrero-rocher-cake", "black-forest-cake", "rasmalai-pista-cake", "barbie-princess-cake"]) {
    const prod = await prisma.product.findUnique({ where: { slug } });
    if (prod) {
      const vc = await prisma.productVariant.count({ where: { productId: prod.id } });
      if (vc === 0) {
        const base = prod.basePrice;
        await prisma.productVariant.createMany({
          data: [
            { name: "500g", price: base, sortOrder: 1, productId: prod.id },
            { name: "1 kg", price: Math.round(base * 1.8), sortOrder: 2, productId: prod.id },
            { name: "2 kg", price: Math.round(base * 3.2), sortOrder: 3, productId: prod.id },
          ],
        });
      }
    }
  }
  console.log("   ✅ Variants added");

  // Update existing products with occasions & forWhom
  const existingUpdates: Record<string, { occasions: string; forWhom: string; servingInfo: string }> = {
    "vanilla-cream-cake-500g": { occasions: '["birthday","celebration"]', forWhom: '["kids","friend","mom"]', servingInfo: "Serves 4-6 people" },
    "chocolate-truffle-cake-500g": { occasions: '["birthday","anniversary","celebration"]', forWhom: '["husband","wife","friend"]', servingInfo: "Serves 4-6 people" },
    "butterscotch-cake-500g": { occasions: '["birthday","celebration"]', forWhom: '["kids","friend","dad"]', servingInfo: "Serves 4-6 people" },
    "red-velvet-cake-500g": { occasions: '["birthday","anniversary","valentine"]', forWhom: '["wife","husband"]', servingInfo: "Serves 4-6 people" },
    "pineapple-cake-500g": { occasions: '["birthday","celebration"]', forWhom: '["mom","dad","friend"]', servingInfo: "Serves 4-6 people" },
  };
  for (const [slug, data] of Object.entries(existingUpdates)) {
    await prisma.product.updateMany({ where: { slug }, data });
  }
  console.log("   ✅ Existing products updated with occasions");

  // --- Store Add-Ons (global, admin-controlled) ---
  const existingAddOns = await prisma.storeAddOn.count({ where: { storeId: store.id } });
  if (existingAddOns === 0) {
    await prisma.storeAddOn.createMany({
      data: [
        { name: "Birthday Candles (set of 10)", price: 20, category: "DECORATION", sortOrder: 1, storeId: store.id },
        { name: "Number Candle", price: 40, category: "DECORATION", sortOrder: 2, storeId: store.id },
        { name: "Happy Birthday Cake Topper", price: 50, category: "DECORATION", sortOrder: 3, storeId: store.id },
        { name: "Anniversary Cake Topper", price: 50, category: "DECORATION", sortOrder: 4, storeId: store.id },
        { name: "Party Poppers (4 pcs)", price: 60, category: "DECORATION", sortOrder: 5, storeId: store.id },
        { name: "Knife & Server Set", price: 25, category: "ACCESSORY", sortOrder: 6, storeId: store.id },
        { name: "Message Card", price: 30, category: "ACCESSORY", sortOrder: 7, storeId: store.id },
        { name: "Gift Wrapping", price: 50, category: "ACCESSORY", sortOrder: 8, storeId: store.id },
        { name: "Bouquet - 12 Roses", price: 399, category: "GIFT", sortOrder: 9, storeId: store.id },
        { name: "Teddy Bear (Small)", price: 299, category: "GIFT", sortOrder: 10, storeId: store.id },
        { name: "Photo Frame", price: 199, category: "GIFT", sortOrder: 11, storeId: store.id },
      ],
    });
    console.log("   ✅ 11 store add-ons created");
  }

  console.log("✅ Expanded catalog seed complete!");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
