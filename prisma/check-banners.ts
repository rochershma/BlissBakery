const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
db.banner.findMany().then((b: any) => console.log(JSON.stringify(b, null, 2))).finally(() => db.$disconnect());
