import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "PICKED_UP", "CANCELLED"]),
  notifyCustomer: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false }, { status: 401 });

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, notifyCustomer } = schema.parse(body);

    const order = await db.order.update({
      where: { id },
      data: {
        status,
        customerNotified: notifyCustomer || false,
      },
      include: { user: true },
    });

    await db.orderStatusLog.create({
      data: {
        orderId: id,
        status,
        note: `Updated by ${user.name || user.role}`,
        notifiedCustomer: notifyCustomer || false,
      },
    });

    // TODO: If notifyCustomer, send WhatsApp message
    if (notifyCustomer) {
      console.log(`📱 WhatsApp notification to ${order.user.phone}: Order #${order.orderNumber} status → ${status}`);
    }

    return NextResponse.json({ success: true, status: order.status });
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json({ success: false, message: "Failed to update" }, { status: 500 });
  }
}
