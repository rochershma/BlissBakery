import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  // Add 'designer' tag to all designer-cakes category products
  const designerCat = await p.category.findUnique({ where: { slug: "designer-cakes" } });
  if (designerCat) {
    const products = await p.product.findMany({ where: { categoryId: designerCat.id } });
    let fixed = 0;
    for (const prod of products) {
      const occ: string[] = prod.occasions ? JSON.parse(prod.occasions as string) : [];
      if (!occ.includes("designer")) {
        occ.push("designer");
        await p.product.update({ where: { id: prod.id }, data: { occasions: JSON.stringify(occ) } });
        fixed++;
      }
    }
    console.log(`Designer tagged: ${fixed}`);
  }

  // Add 'festival' tag to celebration cakes
  const allCakes = await p.product.findMany({ where: { category: { slug: { in: ["cakes", "occasion-cakes"] } } } });
  let festFixed = 0;
  for (const prod of allCakes) {
    const occ: string[] = prod.occasions ? JSON.parse(prod.occasions as string) : [];
    if (occ.includes("celebration") && !occ.includes("festival")) {
      occ.push("festival");
      await p.product.update({ where: { id: prod.id }, data: { occasions: JSON.stringify(occ) } });
      festFixed++;
    }
  }
  console.log(`Festival tagged: ${festFixed}`);

  // Add 'retirement' to some celebration cakes  
  let retFixed = 0;
  for (const prod of allCakes.slice(0, 20)) {
    const occ: string[] = prod.occasions ? JSON.parse(prod.occasions as string) : [];
    if (occ.includes("celebration") && !occ.includes("retirement")) {
      occ.push("retirement");
      await p.product.update({ where: { id: prod.id }, data: { occasions: JSON.stringify(occ) } });
      retFixed++;
    }
  }
  console.log(`Retirement tagged: ${retFixed}`);

  // Final counts
  for (const slug of ["birthday", "anniversary", "designer", "wedding", "festival", "retirement", "valentine", "celebration"]) {
    const count = await p.product.count({ where: { occasions: { contains: slug }, isAvailable: true } });
    console.log(`  ${slug}: ${count} products`);
  }
}

main().finally(() => p.$disconnect());
