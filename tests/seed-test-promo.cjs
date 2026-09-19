const { PrismaClient } = require("../src/generated/prisma");
const d = new PrismaClient();
(async () => {
  const from = new Date("2020-01-01");
  const to = new Date(); to.setFullYear(to.getFullYear() + 5);
  const data = { discountType: "PERCENTAGE", discountValue: 10, minOrderValue: 100, maxDiscount: 100,
    validFrom: from, validTo: to, isActive: true, occasionTag: null, perUserLimit: 999999, usageLimit: 999999 };
  await d.promoCode.upsert({ where: { code: "E2ETEST" }, update: data, create: { code: "E2ETEST", ...data } });
  console.log(JSON.stringify(await d.promoCode.findUnique({ where: { code: "E2ETEST" },
    select: { code: true, perUserLimit: true, usageLimit: true, occasionTag: true } })));
  await d.$disconnect();
})();
