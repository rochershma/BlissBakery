// Removes outlets left behind by a crashed test run. Anything whose slug looks
// like a suite tag and which has no orders.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const junk = await db.store.findMany({
  where: {
    OR: [
      { slug: { startsWith: "cfg" } },
      { slug: { startsWith: "ms" } },
      { slug: { startsWith: "crud" } },
      { name: { contains: "Outlet" } },
    ],
    orders: { none: {} },
  },
  select: { id: true, slug: true, name: true },
});
for (const s of junk) {
  await db.store.delete({ where: { id: s.id } });
  console.log(`removed ${s.slug}`);
}
console.log(junk.length === 0 ? "nothing to clean" : `${junk.length} removed`);
await db.$disconnect();
