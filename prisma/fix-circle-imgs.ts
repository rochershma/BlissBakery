const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  // Set proper representative images for each category
  // Use the best product image from each category, or a matching bakingo image
  const fixes: Record<string, string> = {
    "cakes": "/images/bakingo/choco-truffle-1.jpg",          // Signature chocolate truffle
    "pastries": "/images/bakingo/butterscotch-1.jpg",         // Butterscotch pastry-like
    "brownies": "/images/bakingo/choco-dream-1.jpg",          // Chocolatey brownie-like
    "cookies-biscuits": "/images/bakingo/choco-chip-1.jpg",   // Choco chip cookies
    "designer-cakes": "/images/bakingo/stylish-fondant-barbie-cake-them3715flav-AA.jpg", // Barbie designer
    "occasion-cakes": "/images/bakingo/vanilla-rosette-birthday-cake-cake4034vani-AA.jpg", // Rosette birthday
  };

  for (const [slug, image] of Object.entries(fixes)) {
    const result = await db.category.updateMany({ where: { slug }, data: { image } });
    if (result.count > 0) console.log(`✅ ${slug} -> ${image.split("/").pop()}`);
  }
}

main().finally(() => db.$disconnect());
