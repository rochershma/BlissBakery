import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const promos = await db.promoCode.findMany({
    where: { isActive: true, validTo: { gt: new Date() }, validFrom: { lte: new Date() } },
    select: { code: true, discountType: true, discountValue: true, occasionTag: true, minOrderValue: true, maxDiscount: true },
    orderBy: { discountValue: "desc" },
    take: 5,
  });
  return NextResponse.json({ promos });
}
