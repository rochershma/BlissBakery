import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promoScope } from "@/lib/promo-scope";

export async function GET(req: NextRequest) {
  const scope = await promoScope(req.nextUrl.searchParams.get("store"));

  const promos = await db.promoCode.findMany({
    where: { isActive: true, validTo: { gt: new Date() }, validFrom: { lte: new Date() }, ...scope },
    select: { code: true, discountType: true, discountValue: true, occasionTag: true, minOrderValue: true, maxDiscount: true },
    orderBy: { discountValue: "desc" },
    take: 5,
  });
  return NextResponse.json({ promos });
}
