import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "PICKED_UP", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "REFUNDED"]).optional(),
  notifyCustomer: z.boolean().optional(),
}).refine((b) => b.status || b.paymentStatus, "Nothing to update");

const DELIVERY_ONLY = new Set(["OUT_FOR_DELIVERY", "DELIVERED"]);

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
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message ?? "Invalid update" }, { status: 400 });
    }
    const { status, paymentStatus, notifyCustomer } = parsed.data;

    const existing = await db.order.findUnique({ where: { id }, select: { orderType: true } });
    if (!existing) return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    if (status) {
      const pickup = existing.orderType === "PICKUP";
      if ((pickup && DELIVERY_ONLY.has(status)) || (!pickup && status === "PICKED_UP")) {
        return NextResponse.json(
          { success: false, message: `A ${pickup ? "pickup" : "delivery"} order can't be marked ${status.replace(/_/g, " ").toLowerCase()}` },
          { status: 400 },
        );
      }
    }

    const order = await db.order.update({
      where: { id },
      data: {
        ...(status ? { status, customerNotified: notifyCustomer || false } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      },
      include: { user: true },
    });

    await db.orderStatusLog.create({
      data: {
        orderId: id,
        status: status ?? order.status,
        note: status
          ? `Updated by ${user.name || user.role}`
          : `Payment marked ${paymentStatus?.toLowerCase()} by ${user.name || user.role}`,
        notifiedCustomer: notifyCustomer || false,
      },
    });

    return NextResponse.json({ success: true, status: order.status, paymentStatus: order.paymentStatus });
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json({ success: false, message: "Failed to update" }, { status: 500 });
  }
}
