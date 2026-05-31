import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const store = await db.store.findFirst();
  if (!store) throw new Error("No store found");

  // Deactivate all existing banners
  await db.banner.updateMany({ data: { isActive: false } });

  // Create new HD banners
  const banners = [
    { title: "Birthday Cakes", mediaUrl: "/images/hero/bakingo-birthday.png", linkUrl: "/cakes/birthday", sortOrder: 0 },
    { title: "Anniversary Cakes", mediaUrl: "/images/hero/bakingo-anniversary.png", linkUrl: "/cakes/anniversary", sortOrder: 1 },
    { title: "Designer Cakes", mediaUrl: "/images/hero/bakingo-designer.png", linkUrl: "/store/kuchaman-city/menu?category=designer-cakes", sortOrder: 2 },
    { title: "Mango Cakes", mediaUrl: "/images/hero/bakingo-mango.png", linkUrl: "/store/kuchaman-city/menu", sortOrder: 3 },
    { title: "Gourmet Cakes", mediaUrl: "/images/hero/bakingo-gourmet.png", linkUrl: "/store/kuchaman-city/menu", sortOrder: 4 },
  ];

  for (const b of banners) {
    await db.banner.create({
      data: { ...b, mediaType: "image", isActive: true, storeId: store.id },
    });
    console.log(`✅ Created: ${b.title}`);
  }

  console.log("\nDone! 5 new HD banners active.");
}

main().catch(console.error).finally(() => db.$disconnect());
