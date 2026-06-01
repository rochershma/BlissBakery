import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import { z } from "zod";

const sanitize = (s: string | undefined | null) => s?.replace(/<[^>]*>/g, "").trim() || null;

const schema = z.object({
  storeSlug: z.string(),
  orderType: z.enum(["PICKUP", "DELIVERY"]),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string().transform(s => s.replace(/<[^>]*>/g, "")),
    variantName: z.string().optional(),
    quantity: z.number().min(1).max(50),
    unitPrice: z.number(),
    addOns: z.array(z.object({ name: z.string(), price: z.number() })).optional(),
    cakeMessage: z.string().max(25).optional(),
    occasion: z.string().max(30).optional(),
    recipientName: z.string().max(30).optional(),
    recipientAge: z.string().max(3).optional(),
  })).min(1, "At least one item is required"),
  specialInstructions: z.string().max(500).optional(),
  promoCode: z.string().max(20).optional(),
  deliveryAddress: z.string().max(500).optional(),
  deliveryDate: z.string().optional(),
  deliverySlot: z.enum(["morning", "afternoon", "evening"]).optional(),
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

    // Calculate totals — SERVER-SIDE price lookup (never trust client prices)
    let itemTotal = 0;
    const verifiedItems = [];
    for (const item of data.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });
      if (!product || !product.isAvailable) {
        return NextResponse.json({ success: false, message: `Product "${item.name}" is not available` }, { status: 400 });
      }
      // Determine correct price from DB
      let serverPrice = product.basePrice;
      if (item.variantName) {
        const variant = product.variants.find(v => v.name === item.variantName);
        if (variant) serverPrice = variant.price;
      }
      const addOnTotal = (item.addOns || []).reduce((s, a) => s + a.price, 0);
      itemTotal += (serverPrice + addOnTotal) * item.quantity;
      verifiedItems.push({ ...item, unitPrice: serverPrice });
    }

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
        deliveryAddress: sanitize(data.deliveryAddress),
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        deliverySlot: data.deliverySlot || null,
        specialInstructions: sanitize(data.specialInstructions),
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
          create: verifiedItems.map((item) => ({
            productId: item.productId,
            productName: sanitize(item.name) || item.name,
            variantName: item.variantName || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            addOns: item.addOns ? JSON.stringify(item.addOns) : null,
            totalPrice: (item.unitPrice + (item.addOns || []).reduce((s, a) => s + a.price, 0)) * item.quantity,
            cakeMessage: sanitize(item.cakeMessage),
            occasion: sanitize(item.occasion),
            recipientName: sanitize(item.recipientName),
            recipientAge: item.recipientAge?.replace(/\D/g, "") || null,
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
      return NextResponse.json({ success: false, message: error.issues[0].message }, { status: 400 });
    }
    console.error("Create order error:", error);
    return NextResponse.json({ success: false, message: "Failed to create order" }, { status: 500 });
  }
}
