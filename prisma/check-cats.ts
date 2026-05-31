const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
async function main() {
  const cats = await db.category.findMany({
    select: { id: true, name: true, slug: true, storeId: true, isVisible: true, _count: { select: { products: true } } }
  });
  cats.forEach((x: any) => console.log(x.slug, "visible=" + x.isVisible, x.storeId ? "store=" + x.storeId : "NO_STORE", "products=" + x._count.products));
}
main().finally(() => db.$disconnect());
