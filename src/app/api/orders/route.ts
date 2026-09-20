import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatStoreAddress } from "@/lib/utils";

const PAGE = 20;

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, orders: [] });
    }

    // A regular customer builds up hundreds of orders; send a page at a time.
    const skip = Math.max(0, parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10) || 0);

    const orders = await db.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE + 1,
      include: {
        store: { select: { name: true, phone: true, address: true, city: true, state: true, pincode: true } },
        items: {
          include: {
            product: {
              select: { images: true, slug: true },
            },
          },
        },
      },
    });

    const hasMore = orders.length > PAGE;
    const pageRows = hasMore ? orders.slice(0, PAGE) : orders;

    return NextResponse.json({
      success: true,
      hasMore,
      nextOffset: skip + pageRows.length,
      orders: pageRows.map((o) => {
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
          deliverySlot: o.deliverySlot,
          deliveryDate: o.deliveryDate ? o.deliveryDate.toISOString() : null,
          storeName: o.store?.name ?? null,
          storeAddress: formatStoreAddress(o.store),
          storePhone: o.store?.phone ?? null,
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
            flavour: i.flavour,
            occasion: i.occasion,
            recipientName: i.recipientName,
            recipientAge: i.recipientAge,
            image: parseImages(i.product?.images ?? null)?.[0] || null,
            slug: i.product?.slug ?? null,
          })),
        };
      }),
    });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ success: false, orders: [] }, { status: 500 });
  }
}
