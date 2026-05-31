/**
 * Export all data from SQLite to JSON for migration to MySQL
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const db = new PrismaClient();

async function main() {
  const data: Record<string, any[]> = {};

  // Export all tables in order (respecting relations)
  const tables = [
    "store", "category", "user", "address", "product", "productVariant",
    "productAddOn", "banner", "promoCode", "otpSession", "asset",
    "storeAddOn", "occasion", "recipient", "order", "orderItem",
    "orderStatusLog", "customCakeOrder",
  ];

  for (const table of tables) {
    try {
      data[table] = await (db as any)[table].findMany();
      console.log(`✅ ${table}: ${data[table].length} records`);
    } catch (e: any) {
      console.log(`⚠️ ${table}: ${e.message?.substring(0, 60)}`);
      data[table] = [];
    }
  }

  const outPath = path.join(__dirname, "data-export.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`\n📦 Exported to ${outPath} (${Math.round(fs.statSync(outPath).size / 1024)}KB)`);
}

main().finally(() => db.$disconnect());
