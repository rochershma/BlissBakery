/**
 * Upload all local product/banner/category images to Cloudinary
 * and update DB references
 */
const { PrismaClient } = require("@prisma/client");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const db = new PrismaClient();
const PUBLIC_DIR = path.join(__dirname, "..", "public");

// Track uploaded URLs to avoid duplicates
const uploadCache: Record<string, string> = {};

async function uploadFile(localPath: string, folder: string): Promise<string | null> {
  // Already uploaded?
  if (uploadCache[localPath]) return uploadCache[localPath];

  const fullPath = path.join(PUBLIC_DIR, localPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️ Missing: ${localPath}`);
    return null;
  }

  const filename = path.basename(localPath, path.extname(localPath));

  try {
    const result = await cloudinary.uploader.upload(fullPath, {
      folder: `blissbakery/${folder}`,
      public_id: filename,
      resource_type: "auto",
      quality: "auto",
      fetch_format: "auto",
      overwrite: false,
    });
    uploadCache[localPath] = result.secure_url;
    return result.secure_url;
  } catch (e: any) {
    // If already exists, get the URL
    if (e.http_code === 409 || e.message?.includes("already exists")) {
      const url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/blissbakery/${folder}/${filename}`;
      uploadCache[localPath] = url;
      return url;
    }
    console.log(`  ❌ Upload failed: ${localPath} - ${e.message?.substring(0, 60)}`);
    return null;
  }
}

async function uploadImageArray(imagesJson: string | null, folder: string): Promise<string | null> {
  if (!imagesJson) return null;
  try {
    const imgs: string[] = JSON.parse(imagesJson);
    if (!Array.isArray(imgs) || imgs.length === 0) return null;

    const newImgs: string[] = [];
    for (const img of imgs) {
      if (img.startsWith("http")) {
        newImgs.push(img); // Already a URL
      } else {
        const uploaded = await uploadFile(img, folder);
        newImgs.push(uploaded || img); // Keep local path as fallback
      }
    }
    return JSON.stringify(newImgs);
  } catch {
    return null;
  }
}

async function main() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error("❌ Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env");
    process.exit(1);
  }

  console.log("=== Uploading Product Images ===");
  const products = await db.product.findMany({ select: { id: true, name: true, images: true } });
  let productCount = 0;
  for (const p of products) {
    const newImages = await uploadImageArray(p.images, "products");
    if (newImages && newImages !== p.images) {
      await db.product.update({ where: { id: p.id }, data: { images: newImages } });
      productCount++;
      process.stdout.write(".");
    }
  }
  console.log(`\n✅ ${productCount}/${products.length} products updated`);

  console.log("\n=== Uploading Banner Images ===");
  const banners = await db.banner.findMany();
  let bannerCount = 0;
  for (const b of banners) {
    if (b.mediaUrl.startsWith("/")) {
      const uploaded = await uploadFile(b.mediaUrl, "banners");
      if (uploaded) {
        await db.banner.update({ where: { id: b.id }, data: { mediaUrl: uploaded } });
        bannerCount++;
        console.log(`  ✅ ${b.title}`);
      }
    }
  }
  console.log(`✅ ${bannerCount} banners updated`);

  console.log("\n=== Uploading Category Images ===");
  const categories = await db.category.findMany();
  let catCount = 0;
  for (const c of categories) {
    if (c.image && c.image.startsWith("/")) {
      const uploaded = await uploadFile(c.image, "categories");
      if (uploaded) {
        await db.category.update({ where: { id: c.id }, data: { image: uploaded } });
        catCount++;
        console.log(`  ✅ ${c.name}`);
      }
    }
  }
  console.log(`✅ ${catCount} categories updated`);

  console.log("\n=== Uploading Occasion Images ===");
  const occasions = await db.occasion.findMany({ include: { recipients: true } });
  for (const o of occasions) {
    if (o.image && o.image.startsWith("/")) {
      const uploaded = await uploadFile(o.image, "occasions");
      if (uploaded) {
        await db.occasion.update({ where: { id: o.id }, data: { image: uploaded } });
        console.log(`  ✅ ${o.name}`);
      }
    }
    for (const r of o.recipients) {
      if (r.image && r.image.startsWith("/")) {
        const uploaded = await uploadFile(r.image, "recipients");
        if (uploaded) {
          await db.recipient.update({ where: { id: r.id }, data: { image: uploaded } });
          console.log(`    ✅ ${r.name}`);
        }
      }
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Total uploads: ${Object.keys(uploadCache).length}`);
}

main().catch(console.error).finally(() => db.$disconnect());
