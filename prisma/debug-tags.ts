import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const all = await p.product.findMany({ select: { slug: true, occasions: true, forWhom: true } });
  let tagged = 0, untagged = 0;
  const byOccasion: Record<string, number> = {};
  const untaggedSlugs: string[] = [];
  all.forEach(prod => {
    try {
      const occ = prod.occasions ? JSON.parse(prod.occasions as string) : [];
      if (Array.isArray(occ) && occ.length > 0) { tagged++; occ.forEach((o: string) => { byOccasion[o] = (byOccasion[o] || 0) + 1; }); }
      else { untagged++; untaggedSlugs.push(prod.slug); }
    } catch { untagged++; untaggedSlugs.push(prod.slug); }
  });
  console.log(`Tagged: ${tagged}, Untagged: ${untagged}`);
  console.log("By occasion:", JSON.stringify(byOccasion, null, 2));
  if (untaggedSlugs.length > 0) console.log("Untagged:", untaggedSlugs.join(", "));

  // Test the actual query used by occasion page
  const bdayProducts = await p.product.findMany({ where: { isAvailable: true, occasions: { contains: "birthday" } } });
  console.log(`\nBirthday query result: ${bdayProducts.length} products`);
  
  const anniProducts = await p.product.findMany({ where: { isAvailable: true, occasions: { contains: "anniversary" } } });
  console.log(`Anniversary query result: ${anniProducts.length} products`);

  // Check what occasion values look like in DB
  const sample = await p.product.findFirst({ where: { slug: "rich-choco-truffle" }, select: { slug: true, occasions: true, forWhom: true } });
  console.log("\nSample (rich-choco-truffle):", JSON.stringify(sample));
}
main().finally(() => p.$disconnect());
