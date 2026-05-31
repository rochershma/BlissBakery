import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const db = new PrismaClient();

const bakingo = path.join(__dirname, "..", "public", "images", "bakingo");
const existingFiles = new Set(fs.readdirSync(bakingo));

async function main() {
  const products = await db.product.findMany({ select: { id: true, name: true, images: true } });
  
  let broken = 0;
  let ok = 0;
  
  for (const p of products) {
    const imgs: string[] = (() => { try { const x = JSON.parse(p.images as string); return Array.isArray(x) ? x : []; } catch { return []; } })();
    
    for (const img of imgs) {
      if (img.startsWith("/images/bakingo/")) {
        const fname = img.replace("/images/bakingo/", "");
        if (!existingFiles.has(fname)) {
          console.log(`❌ ${p.name}: ${fname}`);
          broken++;
        } else {
          ok++;
        }
      } else if (img.startsWith("/uploads/") || img.startsWith("/images/hero/") || img.startsWith("/images/products/")) {
        // Check these too
        const fullPath = path.join(__dirname, "..", "public", img);
        if (!fs.existsSync(fullPath)) {
          console.log(`❌ ${p.name}: ${img}`);
          broken++;
        } else {
          ok++;
        }
      }
    }
  }
  
  console.log(`\nBroken: ${broken}, OK: ${ok}`);
}

main().catch(console.error).finally(() => db.$disconnect());
