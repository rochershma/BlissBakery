/**
 * Import data from SQLite export into MySQL
 * Reads data-export.json and inserts into MySQL tables
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const db = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, "data-export.json");
  if (!fs.existsSync(dataPath)) {
    console.error("❌ data-export.json not found. Run export-data.ts first.");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // Helper to convert date strings back to Date objects
  function fixDates(obj: any, fields: string[]): any {
    for (const f of fields) {
      if (obj[f]) obj[f] = new Date(obj[f]);
    }
    return obj;
  }

  // Import order matters - parents before children
  const importOrder = [
    { table: "store", dates: ["createdAt", "updatedAt"] },
    { table: "category", dates: ["createdAt", "updatedAt"] },
    { table: "user", dates: ["createdAt", "updatedAt"] },
    { table: "address", dates: ["createdAt"] },
    { table: "product", dates: ["createdAt", "updatedAt"] },
    { table: "productVariant", dates: [] },
    { table: "productAddOn", dates: [] },
    { table: "banner", dates: ["createdAt"] },
    { table: "promoCode", dates: ["validFrom", "validTo", "createdAt"] },
    { table: "otpSession", dates: ["expiresAt", "createdAt"] },
    { table: "asset", dates: ["createdAt"] },
    { table: "storeAddOn", dates: ["createdAt"] },
    { table: "occasion", dates: ["createdAt"] },
    { table: "recipient", dates: [] },
    { table: "order", dates: ["deliveryDate", "createdAt", "updatedAt"] },
    { table: "orderItem", dates: [] },
    { table: "orderStatusLog", dates: ["createdAt"] },
    { table: "customCakeOrder", dates: ["preferredDate", "createdAt", "updatedAt"] },
  ];

  for (const { table, dates } of importOrder) {
    const records = data[table] || [];
    if (records.length === 0) {
      console.log(`⏭️  ${table}: 0 records (skip)`);
      continue;
    }

    // Check if table already has data
    try {
      const count = await (db as any)[table].count();
      if (count > 0) {
        console.log(`⏭️  ${table}: already has ${count} records (skip)`);
        continue;
      }
    } catch (e: any) {
      console.log(`⚠️  ${table}: ${e.message?.substring(0, 50)}`);
      continue;
    }

    let imported = 0;
    let failed = 0;
    for (const record of records) {
      try {
        fixDates(record, dates);
        // Remove any relation fields that Prisma doesn't accept on create
        const cleaned = { ...record };
        delete cleaned.store;
        delete cleaned.category;
        delete cleaned.product;
        delete cleaned.user;
        delete cleaned.order;
        delete cleaned.occasion;

        await (db as any)[table].create({ data: cleaned });
        imported++;
      } catch (e: any) {
        failed++;
        if (failed <= 3) {
          console.log(`  ❌ ${table} record failed: ${e.message?.substring(0, 80)}`);
        }
      }
    }
    console.log(`✅ ${table}: ${imported}/${records.length} imported${failed > 0 ? ` (${failed} failed)` : ""}`);
  }

  // Final verification
  console.log("\n=== Verification ===");
  const productCount = await db.product.count();
  const orderCount = await db.order.count();
  const userCount = await db.user.count();
  console.log(`Products: ${productCount}, Orders: ${orderCount}, Users: ${userCount}`);
}

main().catch(console.error).finally(() => db.$disconnect());
