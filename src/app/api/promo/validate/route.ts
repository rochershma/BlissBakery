import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Login required" }, { status: 401 });
    }

    const { code, subtotal } = await req.json();
    if (!code || typeof subtotal !== "number") {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
    }

    const promo = await db.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      return NextResponse.json({ success: false, message: "Invalid promo code" }, { status: 400 });
    }

    const now = new Date();
    if (promo.validFrom > now || promo.validTo < now) {
      return NextResponse.json({ success: false, message: "Promo code has expired" }, { status: 400 });
    }

    if (promo.minOrderValue && subtotal < promo.minOrderValue) {
      return NextResponse.json({
        success: false,
        message: `Minimum order value is ₹${promo.minOrderValue}`,
      }, { status: 400 });
    }

    // Check usage limits
    if (promo.usageLimit) {
      const totalUsed = await db.order.count({ where: { promoCode: promo.code } });
      if (totalUsed >= promo.usageLimit) {
        return NextResponse.json({ success: false, message: "Promo code usage limit reached" }, { status: 400 });
      }
    }

    if (promo.perUserLimit) {
      const userUsed = await db.order.count({
        where: { promoCode: promo.code, userId: session.userId },
      });
      if (userUsed >= promo.perUserLimit) {
        return NextResponse.json({ success: false, message: "You've already used this promo code" }, { status: 400 });
      }
    }

    // Calculate discount
    let discount = 0;
    if (promo.discountType === "PERCENTAGE") {
      discount = subtotal * (promo.discountValue / 100);
      if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
    } else {
      discount = promo.discountValue;
    }

    discount = Math.min(discount, subtotal); // Can't discount more than subtotal

    return NextResponse.json({
      success: true,
      code: promo.code,
      discount: Math.round(discount * 100) / 100,
      message: `${promo.code} applied! You save ₹${discount.toFixed(0)}`,
    });
  } catch (error) {
    console.error("Promo validation error:", error);
    return NextResponse.json({ success: false, message: "Failed to validate promo" }, { status: 500 });
  }
}
