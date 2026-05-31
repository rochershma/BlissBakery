import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, customerPhone, cakeSize, baseFlavour, frosting, filling, shape, theme, messageOnCake, preferredDate, referenceImages, budget, specialNotes } = body;

    // Validate required fields
    if (!customerName?.trim() || !customerPhone?.trim() || !cakeSize || !baseFlavour) {
      return NextResponse.json({ success: false, message: "Name, phone, size, and flavour are required" }, { status: 400 });
    }

    // Validate phone
    if (!/^[6-9]\d{9}$/.test(customerPhone.replace(/\s/g, ""))) {
      return NextResponse.json({ success: false, message: "Invalid phone number" }, { status: 400 });
    }

    // Sanitize text inputs
    const sanitize = (s: string | undefined) => s?.replace(/<[^>]*>/g, "").trim() || null;

    const session = await getSession();

    const orderNumber = `CC-${Date.now().toString(36).toUpperCase()}`;

    const order = await db.customCakeOrder.create({
      data: {
        orderNumber,
        userId: session?.userId || null,
        customerName: sanitize(customerName)!,
        customerPhone: customerPhone.replace(/\s/g, ""),
        cakeSize,
        baseFlavour,
        frosting: sanitize(frosting),
        theme: sanitize(theme),
        messageOnCake: sanitize(messageOnCake),
        designDescription: sanitize(filling) || sanitize(shape) || sanitize(specialNotes),
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        referenceImages: referenceImages ? JSON.stringify(referenceImages) : null,
        budgetRange: budget ? String(budget) : null,
        status: "RECEIVED",
      },
    });

    return NextResponse.json({ success: true, orderNumber: order.orderNumber });
  } catch (error) {
    console.error("Custom cake order error:", error);
    return NextResponse.json({ success: false, message: "Failed to submit order" }, { status: 500 });
  }
}
