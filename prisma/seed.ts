import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Bliss Bakery database...");

  // Create store
  const store = await prisma.store.upsert({
    where: { slug: "kuchaman-city" },
    update: { logo: "/uploads/branding/logo.png" },
    create: {
      name: "Bliss Bakery",
      slug: "kuchaman-city",
      tagline: "100% Veg & Eggless",
      description:
        "Premium artisan bakery in Kuchaman City. Every product is 100% vegetarian and eggless, made with love and the finest ingredients.",
      address: "Main Market, Kuchaman City",
      city: "Kuchaman City",
      state: "Rajasthan",
      pincode: "341508",
      phone: "9602831559",
      email: "hello@blissbakery.in",
      logo: "/uploads/branding/logo.png",
      isOpen: true,
      operatingHours: JSON.stringify({
        mon: { open: "08:00", close: "22:00" },
        tue: { open: "08:00", close: "22:00" },
        wed: { open: "08:00", close: "22:00" },
        thu: { open: "08:00", close: "22:00" },
        fri: { open: "08:00", close: "22:00" },
        sat: { open: "08:00", close: "22:00" },
        sun: { open: "08:00", close: "22:00" },
      }),
      deliveryRadius: 10,
      minDeliveryOrder: 200,
      deliveryCharge: 30,
      packagingCharge: 15,
      gstRate: 5.0,
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "cakes" },
      update: {},
      create: { name: "Cakes", slug: "cakes", sortOrder: 1, storeId: store.id },
    }),
    prisma.category.upsert({
      where: { slug: "pastries" },
      update: {},
      create: { name: "Pastries", slug: "pastries", sortOrder: 2, storeId: store.id },
    }),
    prisma.category.upsert({
      where: { slug: "brownies" },
      update: {},
      create: { name: "Brownies", slug: "brownies", sortOrder: 3, storeId: store.id },
    }),
    prisma.category.upsert({
      where: { slug: "cookies-biscuits" },
      update: {},
      create: { name: "Cookies & Biscuits", slug: "cookies-biscuits", sortOrder: 4, storeId: store.id },
    }),
    prisma.category.upsert({
      where: { slug: "breads" },
      update: {},
      create: { name: "Breads", slug: "breads", sortOrder: 5, storeId: store.id },
    }),
    prisma.category.upsert({
      where: { slug: "combos" },
      update: {},
      create: { name: "Combos", slug: "combos", sortOrder: 6, storeId: store.id },
    }),
    prisma.category.upsert({
      where: { slug: "beverages" },
      update: {},
      create: { name: "Beverages", slug: "beverages", sortOrder: 7, storeId: store.id },
    }),
  ]);

  const [cakes, pastries, brownies, cookies] = categories;

  // Create sample products
  await Promise.all([
    // Cakes
    prisma.product.upsert({
      where: { slug: "vanilla-cream-cake-500g" },
      update: {},
      create: {
        name: "Vanilla Cream Cake",
        slug: "vanilla-cream-cake-500g",
        shortDesc: "Light, fluffy eggless vanilla sponge with fresh cream frosting",
        description: "Our signature eggless vanilla cake made with the finest ingredients. Light, moist sponge layered with silky vanilla cream and topped with fresh cream rosettes. Perfect for any celebration.",
        basePrice: 450,
        isBestseller: true,
        isFeatured: true,
        categoryId: cakes.id,
        images: JSON.stringify(["/images/hero/1-1mangovanilla.png"]),
      },
    }),
    prisma.product.upsert({
      where: { slug: "chocolate-truffle-cake-500g" },
      update: {},
      create: {
        name: "Chocolate Truffle Cake",
        slug: "chocolate-truffle-cake-500g",
        shortDesc: "Rich dark chocolate ganache over moist chocolate sponge",
        description: "Indulge in layers of rich chocolate sponge covered with luxurious dark chocolate ganache. A chocolate lover's dream — 100% eggless.",
        basePrice: 550,
        isBestseller: true,
        isFeatured: true,
        categoryId: cakes.id,
        images: JSON.stringify(["/images/hero/TuileriesCHOCTRUFFLE.jpg"]),
      },
    }),
    prisma.product.upsert({
      where: { slug: "butterscotch-cake-500g" },
      update: {},
      create: {
        name: "Butterscotch Cake",
        slug: "butterscotch-cake-500g",
        shortDesc: "Creamy butterscotch with crunchy praline topping",
        description: "Soft butterscotch sponge with butterscotch cream, finished with crunchy caramel praline. A crowd favourite.",
        basePrice: 475,
        isBestseller: true,
        categoryId: cakes.id,
        images: JSON.stringify(["/images/hero/Tropicalparadise.png"]),
      },
    }),
    prisma.product.upsert({
      where: { slug: "red-velvet-cake-500g" },
      update: {},
      create: {
        name: "Red Velvet Cake",
        slug: "red-velvet-cake-500g",
        shortDesc: "Classic red velvet with cream cheese frosting",
        description: "Vibrant red velvet sponge paired with smooth cream cheese frosting. Elegant, delicious, and completely eggless.",
        basePrice: 600,
        isNew: true,
        categoryId: cakes.id,
        images: JSON.stringify(["/images/hero/TuileriesCHOCBERRIES.jpg"]),
      },
    }),
    prisma.product.upsert({
      where: { slug: "pineapple-cake-500g" },
      update: {},
      create: {
        name: "Fresh Pineapple Cake",
        slug: "pineapple-cake-500g",
        shortDesc: "Tropical pineapple with fresh cream layers",
        description: "Refreshing pineapple-flavoured sponge with fresh cream and real pineapple pieces.",
        basePrice: 425,
        categoryId: cakes.id,
        images: JSON.stringify(["/images/hero/1_1freshananashcake.png"]),
      },
    }),
    // Pastries
    prisma.product.upsert({
      where: { slug: "chocolate-pastry" },
      update: {},
      create: {
        name: "Chocolate Pastry",
        slug: "chocolate-pastry",
        shortDesc: "Rich chocolate sponge with chocolate cream",
        basePrice: 80,
        isBestseller: true,
        categoryId: pastries.id,
        images: JSON.stringify(["/images/products/Gold-Cheesecake--br-_700-grams_-Tuileries-Patisserie-1658593281.jpg"]),
      },
    }),
    prisma.product.upsert({
      where: { slug: "black-forest-pastry" },
      update: {},
      create: {
        name: "Black Forest Pastry",
        slug: "black-forest-pastry",
        shortDesc: "Chocolate sponge with cherries and whipped cream",
        basePrice: 90,
        isBestseller: true,
        categoryId: pastries.id,
        images: JSON.stringify(["/images/hero/Mango-BlueberryEnt.jpg"]),
      },
    }),
    // Brownies
    prisma.product.upsert({
      where: { slug: "classic-fudge-brownie" },
      update: {},
      create: {
        name: "Classic Fudge Brownie",
        slug: "classic-fudge-brownie",
        shortDesc: "Dense, fudgy chocolate brownie with walnuts",
        basePrice: 120,
        isBestseller: true,
        isFeatured: true,
        categoryId: brownies.id,
        images: JSON.stringify(["/images/products/Belgian-chocolate-chip-cookies-Tuileries-Patisserie-1658593452.jpg"]),
      },
    }),
    // Cookies
    prisma.product.upsert({
      where: { slug: "choco-chip-cookies-6pc" },
      update: {},
      create: {
        name: "Choco Chip Cookies (6 pcs)",
        slug: "choco-chip-cookies-6pc",
        shortDesc: "Crunchy butter cookies loaded with chocolate chips",
        basePrice: 150,
        isFeatured: true,
        categoryId: cookies.id,
        images: JSON.stringify(["/images/products/Belgian-Dark-chocolate-chip-cookies-Tuileries-Patisserie-1658593471.jpg"]),
      },
    }),
  ]);

  // Add variants to cakes
  const vanillaCake = await prisma.product.findUnique({ where: { slug: "vanilla-cream-cake-500g" } });
  if (vanillaCake) {
    const existingVariants = await prisma.productVariant.count({ where: { productId: vanillaCake.id } });
    if (existingVariants === 0) {
      await prisma.productVariant.createMany({
        data: [
          { name: "500g", price: 450, sortOrder: 1, productId: vanillaCake.id },
          { name: "1 kg", price: 800, sortOrder: 2, productId: vanillaCake.id },
          { name: "2 kg", price: 1500, sortOrder: 3, productId: vanillaCake.id },
        ],
      });
      await prisma.productAddOn.createMany({
        data: [
          { name: "Candles (set of 10)", price: 20, productId: vanillaCake.id },
          { name: "Message Card", price: 30, productId: vanillaCake.id },
          { name: "Cake Topper", price: 50, productId: vanillaCake.id },
          { name: "Knife & Server", price: 25, productId: vanillaCake.id },
        ],
      });
    }
  }

  // Create admin user
  await prisma.user.upsert({
    where: { phone: "9602831559" },
    update: { role: "ADMIN" },
    create: {
      phone: "9602831559",
      name: "Bliss Bakery Admin",
      role: "ADMIN",
    },
  });

  // Create sample promo
  await prisma.promoCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderValue: 300,
      maxDiscount: 100,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      usageLimit: 1000,
      perUserLimit: 1,
      occasionTag: "Welcome",
      isActive: true,
    },
  });

  // Create hero banners
  const existingBanners = await prisma.banner.count({ where: { storeId: store.id } });
  if (existingBanners === 0) {
    await prisma.banner.createMany({
      data: [
        {
          title: "Artisan Cakes, Crafted with Love",
          mediaUrl: "/images/hero/AMMO6974.jpg",
          linkUrl: "/store/kuchaman-city/menu",
          sortOrder: 0,
          isActive: true,
          storeId: store.id,
        },
        {
          title: "Chocolate Indulgence",
          mediaUrl: "/images/hero/TuileriesCHOCTRUFFLE.jpg",
          linkUrl: "/store/kuchaman-city/menu?category=cakes",
          sortOrder: 1,
          isActive: true,
          storeId: store.id,
        },
        {
          title: "Celebrate with Bliss Bakery",
          mediaUrl: "/images/hero/valentine_anniversary_17df2fc8-d068-4486-8f01-3aa5b1bf8a33.jpg",
          linkUrl: "/store/kuchaman-city/custom-cakes",
          sortOrder: 2,
          isActive: true,
          storeId: store.id,
        },
      ],
    });
    console.log("   ✅ Hero banners created.");
  }

  // Update existing products with real images
  const imageMap: Record<string, string> = {
    "vanilla-cream-cake-500g": "/images/hero/1-1mangovanilla.png",
    "chocolate-truffle-cake-500g": "/images/hero/TuileriesCHOCTRUFFLE.jpg",
    "butterscotch-cake-500g": "/images/hero/Tropicalparadise.png",
    "red-velvet-cake-500g": "/images/hero/TuileriesCHOCBERRIES.jpg",
    "pineapple-cake-500g": "/images/hero/1_1freshananashcake.png",
    "chocolate-pastry": "/images/products/Gold-Cheesecake--br-_700-grams_-Tuileries-Patisserie-1658593281.jpg",
    "black-forest-pastry": "/images/hero/Mango-BlueberryEnt.jpg",
    "classic-fudge-brownie": "/images/products/Belgian-chocolate-chip-cookies-Tuileries-Patisserie-1658593452.jpg",
    "choco-chip-cookies-6pc": "/images/products/Belgian-Dark-chocolate-chip-cookies-Tuileries-Patisserie-1658593471.jpg",
  };
  for (const [slug, img] of Object.entries(imageMap)) {
    await prisma.product.updateMany({
      where: { slug },
      data: { images: JSON.stringify([img]) },
    });
  }
  console.log("   ✅ Product images updated.");

  console.log("✅ Seed complete!");
  console.log(`   Store: ${store.name} (${store.slug})`);
  console.log(`   Categories: ${categories.length}`);
  console.log("   Sample products, variants, add-ons, admin user, promo code, banners created.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
