import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const staff = await db.user.upsert({
    where: { phone: "9999999999" },
    update: { role: "STAFF" },
    create: { phone: "9999999999", name: "Kitchen Staff", role: "STAFF" },
  });
  console.log("Staff user:", staff.phone, staff.role);
}

main().finally(() => db.$disconnect());
