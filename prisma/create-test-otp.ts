const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
async function main() {
  // Delete old OTPs for these phones
  await db.otpSession.deleteMany({ where: { phone: { in: ["9602831559", "7073766728"] } } });
  // Create permanent test OTPs
  await db.otpSession.create({ data: { id: "perm-otp-1", phone: "9602831559", otp: "999999", expiresAt: new Date("2099-12-31"), verified: false } });
  await db.otpSession.create({ data: { id: "perm-otp-2", phone: "7073766728", otp: "999999", expiresAt: new Date("2099-12-31"), verified: false } });
  const rows = await db.otpSession.findMany({ where: { phone: { in: ["9602831559", "7073766728"] } } });
  rows.forEach(r => console.log(r.phone, r.otp, r.expiresAt));
}
main().finally(() => db.$disconnect());
