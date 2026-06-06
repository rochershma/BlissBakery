const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  // Get slugs of recent products
  const prods = await p.product.findMany({
    select: { slug: true, name: true, flavours: true, category: { select: { slug: true } } },
    take: 5, orderBy: { createdAt: 'desc' }
  });
  prods.forEach(pr => console.log(pr.slug, '|', pr.name, '|', pr.category.slug, '| flavours:', pr.flavours));
  
  // Also check an old product that was "working before"
  const oldProd = await p.product.findFirst({
    where: { category: { slug: 'cakes' } },
    select: { slug: true, name: true, flavours: true, category: { select: { slug: true } } },
  });
  if (oldProd) console.log('\nOld cake:', oldProd.slug, '| flavours:', oldProd.flavours);
  
  await p.$disconnect();
})();
