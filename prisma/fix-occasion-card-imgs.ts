const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  // Use proper portrait-oriented cake images for occasion cards (not the wide banners)
  const fixes: Record<string, string> = {
    "birthday": "/images/categories/birthday.jpg",
    "anniversary": "/images/categories/anniversary.jpg",
    "wedding": "/images/categories/wedding.jpg",
    "designer": "/images/categories/designer.jpg",
    "festival": "/images/categories/festival.jpg",
    "retirement": "/images/categories/retirement.jpg",
    "kids-cake": "/images/categories/for-kids.jpg",
  };

  for (const [slug, image] of Object.entries(fixes)) {
    const result = await db.occasion.updateMany({ where: { slug }, data: { image } });
    if (result.count > 0) console.log(`✅ ${slug} -> ${image}`);
  }
}

main().finally(() => db.$disconnect());
