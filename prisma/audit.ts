const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
async function main() {
  const cats = await db.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { sortOrder: "asc" } });
  cats.forEach((c: any) => console.log(c.slug + ": " + c._count.products + " products (id:" + c.id + ")"));
  console.log("---");
  const total = await db.product.count();
  console.log("Total:", total);
  const occasions = await db.occasion.findMany({ include: { recipients: true } });
  occasions.forEach((o: any) => console.log("Occasion:", o.name, "->", o.recipients.map((r: any) => r.name).join(", ")));
}
main().finally(() => db.$disconnect());
