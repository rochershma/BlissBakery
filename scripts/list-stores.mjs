import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const stores = await db.store.findMany({
  select: { id: true, name: true, slug: true, isOpen: true, _count: { select: { categories: true } } },
});
for (const s of stores) console.log(`${s.slug}\t${s.name}\topen=${s.isOpen}\tcategories=${s._count.categories}`);
await db.$disconnect();
