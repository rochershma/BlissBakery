import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const c = await p.product.count();
  console.log("Total products:", c);
  const cats = await p.category.findMany({ select: { name: true, _count: { select: { products: true } } } });
  cats.forEach(x => console.log(`  ${x.name}: ${x._count.products}`));
}
main().finally(() => p.$disconnect());
