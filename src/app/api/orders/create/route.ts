import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  storeSlug: z.string(),
  orderType: z.enum(["PICKUP", "DELIVERY"]),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    variantName: z.string().optional(),
    quantity: z.number().min(1),
    unitPrice: z.number(),
    addOns: z.array(z.object({ name: z.string(), price: z.number() })).optional(),
  })),
  specialInstructions: z.string().optional(),
  promoCode: z.string().optional(),
  deliveryAddress: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Login required" }, { status: 401 });
    }

    const body = await req.json();
    const data = schema.parse(body);

    const store = await db.store.findUnique({ where: { slug: data.storeSlug } });
    if (!store) {
      return NextResponse.json({ success: false, message: "Store not found" }, { status: 404 });
    }

    // Calculate totals
    const itemTotal = data.items.reduce((sum, item) => {
      const addOnTotal = (item.addOns || []).reduce((s, a) => s + a.price, 0);
      return sum + (item.unitPrice + addOnTotal) * item.quantity;
    }, 0);

    const packagingCharge = store.packagingCharge || 15;
    const deliveryCharge = data.orderType === "DELIVERY" ? (store.deliveryCharge || 30) : 0;
    const gstRate = store.gstRate || 5;

    // Apply promo discount
    let discount = 0;
    if (data.promoCode) {
      const promo = await db.promoCode.findUnique({ where: { code: data.promoCode } });
      if (promo && promo.isActive && new Date(promo.validTo) > new Date()) {
        if (!promo.minOrderValue || itemTotal >= promo.minOrderValue) {
          if (promo.discountType === "PERCENTAGE") {
            discount = Math.min(itemTotal * (promo.discountValue / 100), promo.maxDiscount || Infinity);
          } else {
            discount = promo.discountValue;
          }
          await db.promoCode.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });
        }
      }
    }

    const taxableAmount = itemTotal + packagingCharge + deliveryCharge - discount;
    const tax = taxableAmount * (gstRate / 100);
    const grandTotal = taxableAmount + tax;

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber("BB"),
        userId: session.userId,
        storeId: store.id,
        orderType: data.orderType,
        deliveryAddress: data.deliveryAddress,
        specialInstructions: data.specialInstructions,
        itemTotal,
        packagingCharge,
        deliveryCharge,
        discount,
        tax,
        grandTotal,
        promoCode: data.promoCode,
        status: "PENDING",
        paymentStatus: "PENDING",
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            variantName: item.variantName || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            addOns: item.addOns ? JSON.stringify(item.addOns) : null,
            totalPrice: (item.unitPrice + (item.addOns || []).reduce((s, a) => s + a.price, 0)) * item.quantity,
          })),
        },
        statusHistory: {
          create: { status: "PENDING", note: "Order placed" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.errors[0].message }, { status: 400 });
    }
    console.error("Create order error:", error);
    return NextResponse.json({ success: false, message: "Failed to create order" }, { status: 500 });
  }
}
