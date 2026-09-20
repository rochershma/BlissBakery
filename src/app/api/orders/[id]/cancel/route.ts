import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

/** Statuses a customer may still call off themselves. */
const CANCELLABLE = ["PENDING", "CONFIRMED"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { reason } = await req.json().catch(() => ({ reason: null }));

  const order = await db.order.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });

  if (!order || order.userId !== session.userId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "This order is already cancelled" }, { status: 400 });
  }
  if (!CANCELLABLE.includes(order.status)) {
    return NextResponse.json(
      { error: "This order is already being prepared. Call the store to change it." },
      { status: 409 },
    );
  }

  const note = typeof reason === "string" ? reason.replace(/<[^>]*>/g, "").trim().slice(0, 200) : "";

  await db.$transaction([
    db.order.update({ where: { id }, data: { status: "CANCELLED" } }),
    db.orderStatusLog.create({
      data: {
        orderId: id,
        status: "CANCELLED",
        note: note ? `Cancelled by customer: ${note}` : "Cancelled by customer",
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
