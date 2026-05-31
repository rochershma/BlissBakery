/**
 * Update all local image paths to Cloudinary URLs on the server
 * Reads the data-export.json (which has Cloudinary URLs from local DB)
 * and updates the server DB to match
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const db = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data-export.json"), "utf-8"));

  // Update products
  let pCount = 0;
  for (const p of data.product) {
    if (p.images && p.images.includes("cloudinary")) {
      await db.product.update({ where: { id: p.id }, data: { images: p.images } });
      pCount++;
    }
  }
  console.log(`Products: ${pCount} updated`);

  // Update banners
  let bCount = 0;
  for (const b of data.banner) {
    if (b.mediaUrl && b.mediaUrl.includes("cloudinary")) {
      await db.banner.update({ where: { id: b.id }, data: { mediaUrl: b.mediaUrl } });
      bCount++;
    }
  }
  console.log(`Banners: ${bCount} updated`);

  // Update categories
  let cCount = 0;
  for (const c of data.category) {
    if (c.image && c.image.includes("cloudinary")) {
      await db.category.update({ where: { id: c.id }, data: { image: c.image } });
      cCount++;
    }
  }
  console.log(`Categories: ${cCount} updated`);

  // Update occasions
  for (const o of data.occasion) {
    if (o.image && o.image.includes("cloudinary")) {
      await db.occasion.update({ where: { id: o.id }, data: { image: o.image } });
      console.log(`Occasion: ${o.name}`);
    }
  }

  // Update recipients
  for (const r of data.recipient) {
    if (r.image && r.image.includes("cloudinary")) {
      await db.recipient.update({ where: { id: r.id }, data: { image: r.image } });
      console.log(`Recipient: ${r.name}`);
    }
  }

  console.log("DONE");
}

main().finally(() => db.$disconnect());
