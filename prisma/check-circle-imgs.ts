const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
async function main() {
  const slugs = ["pastries", "brownies", "cakes", "designer-cakes", "occasion-cakes", "cookies-biscuits"];
  for (const slug of slugs) {
    const cat = await db.category.findFirst({ where: { slug } });
    if (!cat) continue;
    const prods = await db.product.findMany({
      where: { categoryId: cat.id, isAvailable: true },
      orderBy: [{ isBestseller: "desc" }, { name: "asc" }],
      take: 3,
      select: { name: true, images: true },
    });
    console.log(`\n${slug} (${cat.name}):`);
    prods.forEach((p: any) => {
      try { const i = JSON.parse(p.images); console.log(`  ${p.name} -> ${i[0] || "NO IMG"}`); }
      catch { console.log(`  ${p.name} -> NO IMG`); }
    });
  }
}
main().finally(() => db.$disconnect());
