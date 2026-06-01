import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, orders: [] });
    }

    const orders = await db.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: { images: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      orders: orders.map((o) => {
        const parseImages = (imgs: string | null) => {
          if (!imgs) return [];
          try { return JSON.parse(imgs); } catch { return []; }
        };
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          orderType: o.orderType,
          paymentStatus: o.paymentStatus,
          itemTotal: o.itemTotal,
          deliveryCharge: o.deliveryCharge,
          packagingCharge: o.packagingCharge,
          discount: o.discount,
          tax: o.tax,
          grandTotal: o.grandTotal,
          specialInstructions: o.specialInstructions,
          deliveryAddress: o.deliveryAddress,
          promoCode: o.promoCode,
          createdAt: o.createdAt.toISOString(),
          items: o.items.map((i) => ({
            id: i.id,
            productName: i.productName,
            variantName: i.variantName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            cakeMessage: i.cakeMessage,
            image: parseImages(i.product?.images)?.[0] || null,
          })),
        };
      }),
    });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ success: false, orders: [] }, { status: 500 });
  }
}
