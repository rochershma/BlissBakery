const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
async function main() {
  // Make occasion-cakes visible
  await db.category.updateMany({ where: { slug: "occasion-cakes" }, data: { isVisible: true } });
  console.log("✅ occasion-cakes set to visible");
  
  // Hide empty categories
  const empty = ["breads", "combos", "beverages"];
  for (const slug of empty) {
    await db.category.updateMany({ where: { slug }, data: { isVisible: false } });
  }
  console.log("✅ Hidden empty categories: breads, combos, beverages");
  
  // Also hide dry-cakes if empty
  await db.category.updateMany({ where: { slug: { startsWith: "dry-cakes" } }, data: { isVisible: false } });
  console.log("✅ Hidden dry-cakes");
}
main().finally(() => db.$disconnect());
