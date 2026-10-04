import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "PICKED_UP", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "REFUNDED"]).optional(),
  notifyCustomer: z.boolean().optional(),
  // The status the admin saw when they clicked — used to detect a concurrent edit.
  expectedStatus: z.string().optional(),
}).refine((b) => b.status || b.paymentStatus, "Nothing to update");

const DELIVERY_ONLY = new Set(["OUT_FOR_DELIVERY", "DELIVERED"]);
const TERMINAL = new Set(["DELIVERED", "PICKED_UP", "CANCELLED"]);

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

    const existing = await db.order.findUnique({ where: { id }, select: { orderType: true, status: true } });
    if (!existing) return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    if (status) {
      const pickup = existing.orderType === "PICKUP";
      if ((pickup && DELIVERY_ONLY.has(status)) || (!pickup && status === "PICKED_UP")) {
        return NextResponse.json(
          { success: false, message: `A ${pickup ? "pickup" : "delivery"} order can't be marked ${status.replace(/_/g, " ").toLowerCase()}` },
          { status: 400 },
        );
      }
      // A finished order shouldn't be re-opened or cancelled out from under itself.
      if (TERMINAL.has(existing.status) && status !== existing.status) {
        return NextResponse.json(
          { success: false, message: `This order is already ${existing.status.replace(/_/g, " ").toLowerCase()} — refresh to see the latest.` },
          { status: 409 },
        );
      }
      // Optimistic lock: if another admin moved the order since this page loaded,
      // refuse rather than clobber their change (and double-notify the customer).
      if (parsed.data.expectedStatus && existing.status !== parsed.data.expectedStatus) {
        return NextResponse.json(
          { success: false, message: "Someone else just updated this order — refresh and try again." },
          { status: 409 },
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
