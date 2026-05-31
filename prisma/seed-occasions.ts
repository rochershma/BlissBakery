import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding occasions and recipients...");
  const store = await prisma.store.findFirst();
  if (!store) { console.log("No store!"); return; }

  const occasions = [
    {
      name: "Birthday Cakes", slug: "birthday", subtitle: "Make every birthday magical with the perfect cake",
      image: "/images/categories/birthday.jpg",
      recipients: [
        { name: "For Wife", slug: "wife", image: "/images/categories/for-wife.jpg" },
        { name: "For Husband", slug: "husband", image: "/images/categories/for-husband.jpg" },
        { name: "For Kids", slug: "kids", image: "/images/categories/for-kids.jpg" },
        { name: "For Mom", slug: "mom", image: "/images/categories/for-mom.jpg" },
        { name: "For Dad", slug: "dad", image: "/images/categories/for-dad.jpg" },
        { name: "For Friend", slug: "friend", image: "/images/categories/for-friend.jpg" },
      ],
    },
    {
      name: "Anniversary Cakes", slug: "anniversary", subtitle: "Celebrate years of love with a special cake",
      image: "/images/categories/anniversary.jpg",
      recipients: [
        { name: "For Wife", slug: "wife", image: "/images/categories/for-wife.jpg" },
        { name: "For Husband", slug: "husband", image: "/images/categories/for-husband.jpg" },
        { name: "For Parents", slug: "mom", image: "/images/categories/for-mom.jpg" },
      ],
    },
    {
      name: "Wedding Cakes", slug: "wedding", subtitle: "Grand cakes for your grand celebration",
      image: "/images/categories/wedding.jpg", recipients: [],
    },
    {
      name: "Designer Cakes", slug: "designer", subtitle: "Unique and artistic cakes for special moments",
      image: "/images/categories/designer.jpg",
      recipients: [
        { name: "For Kids", slug: "kids", image: "/images/categories/for-kids.jpg" },
        { name: "For Her", slug: "wife", image: "/images/categories/for-wife.jpg" },
        { name: "For Him", slug: "husband", image: "/images/categories/for-husband.jpg" },
      ],
    },
    {
      name: "Festival Cakes", slug: "festival", subtitle: "Sweeten every festival with our collection",
      image: "/images/categories/festival.jpg", recipients: [],
    },
    {
      name: "Retirement Cakes", slug: "retirement", subtitle: "Celebrate new beginnings with a memorable cake",
      image: "/images/categories/retirement.jpg", recipients: [],
    },
  ];

  for (let i = 0; i < occasions.length; i++) {
    const o = occasions[i];
    const occ = await prisma.occasion.upsert({
      where: { slug: o.slug },
      update: { name: o.name, subtitle: o.subtitle, image: o.image, sortOrder: i },
      create: { name: o.name, slug: o.slug, subtitle: o.subtitle, image: o.image, sortOrder: i, storeId: store.id },
    });

    for (let j = 0; j < o.recipients.length; j++) {
      const r = o.recipients[j];
      const existing = await prisma.recipient.findFirst({ where: { slug: r.slug, occasionId: occ.id } });
      if (!existing) {
        await prisma.recipient.create({
          data: { name: r.name, slug: r.slug, image: r.image, sortOrder: j, occasionId: occ.id },
        });
      }
    }
  }

  console.log(`✅ ${occasions.length} occasions seeded with recipients`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
