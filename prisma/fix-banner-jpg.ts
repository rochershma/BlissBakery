const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
async function main() {
  const banners = await db.banner.findMany();
  for (const b of banners) {
    if (b.mediaUrl.includes("bakingo-") && b.mediaUrl.endsWith(".png")) {
      const jpg = b.mediaUrl.replace(".png", ".jpg");
      await db.banner.update({ where: { id: b.id }, data: { mediaUrl: jpg } });
      console.log(b.title + " -> " + jpg);
    }
  }
}
main().finally(() => db.$disconnect());
