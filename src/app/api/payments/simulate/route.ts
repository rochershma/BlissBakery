import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// Simulate payment — in production, this would verify Razorpay signature
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Login required" }, { status: 401 });
    }

    const { orderId, simulateStatus } = await req.json();

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== session.userId) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // Simulate payment result
    const status = simulateStatus || "PAID"; // PAID, FAILED, PENDING

    if (status === "PAID") {
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          paymentId: `sim_pay_${Date.now()}`,
          paymentOrderId: `sim_ord_${Date.now()}`,
          status: "CONFIRMED",
        },
      });
      await db.orderStatusLog.create({
        data: { orderId, status: "CONFIRMED", note: "Payment confirmed (simulated)" },
      });
    } else if (status === "FAILED") {
      await db.order.update({
        where: { id: orderId },
        data: { paymentStatus: "FAILED" },
      });
    }

    return NextResponse.json({
      success: status === "PAID",
      paymentStatus: status,
      message: status === "PAID" ? "Payment successful!" : "Payment failed. Please try again.",
    });
  } catch (error) {
    console.error("Payment simulation error:", error);
    return NextResponse.json({ success: false, message: "Payment processing failed" }, { status: 500 });
  }
}
