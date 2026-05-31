const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  // Set proper hero images for occasions using Bakingo banner images we downloaded
  const fixes: Record<string, string> = {
    "birthday": "/images/hero/bakingo-birthday.png",
    "anniversary": "/images/hero/bakingo-anniversary.png",
    "designer": "/images/hero/bakingo-designer.png",
    "wedding": "/images/hero/bakingo-regular.png",
    "festival": "/images/hero/bakingo-mango.png",
    "retirement": "/images/hero/bakingo-gourmet.png",
    "kids-cake": "/images/hero/bakingo-birthday.png",
  };

  for (const [slug, image] of Object.entries(fixes)) {
    const result = await db.occasion.updateMany({ where: { slug }, data: { image } });
    if (result.count > 0) console.log(`✅ ${slug} -> ${image.split("/").pop()}`);
    else console.log(`⏭️  ${slug} not found`);
  }
}

main().finally(() => db.$disconnect());
