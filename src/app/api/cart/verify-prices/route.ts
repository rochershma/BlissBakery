import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ updates: [] });
    }

    const updates: { productId: string; variantName?: string; flavour?: string; correctPrice: number }[] = [];

    for (const item of items.slice(0, 50)) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });
      if (!product || !product.isAvailable) {
        updates.push({ productId: item.productId, variantName: item.variantName, flavour: item.flavour, correctPrice: -1 });
        continue;
      }

      let correctPrice = product.basePrice;

      if (product.pricingStrategy === "CUSTOM" && item.flavour) {
        const flavourPrices: { name: string; price500g: number }[] = (() => {
          try { return typeof product.flavourPrices === "string" ? JSON.parse(product.flavourPrices) : (product.flavourPrices || []); } catch { return []; }
        })();
        const fp = flavourPrices.find((f: { name: string }) => f.name === item.flavour);
        const flavour500g = fp?.price500g || (product.base500gPrice ?? 300);
        const designCharge = product.designCharge ?? 0;
        let weightKg = 0.5;
        if (item.variantName) {
          const match = item.variantName.match(/([\d.]+)\s*[Kk][Gg]/);
          if (match) weightKg = parseFloat(match[1]);
        }
        correctPrice = Math.round(flavour500g * weightKg * 2 + designCharge);
      } else if (item.variantName) {
        const variant = product.variants.find((v: { name: string }) => v.name === item.variantName);
        if (variant) correctPrice = variant.price;
      }

      if (correctPrice !== item.unitPrice) {
        updates.push({ productId: item.productId, variantName: item.variantName, flavour: item.flavour, correctPrice });
      }
    }

    return NextResponse.json({ updates });
  } catch {
    return NextResponse.json({ updates: [] }, { status: 500 });
  }
}
