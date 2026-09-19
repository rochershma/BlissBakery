import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, items: true },
    take: 500,
  });

  // Build CSV
  const headers = ["Order #", "Date", "Customer", "Phone", "Type", "Status", "Payment", "Items", "Total", "Promo"];
  const rows = orders.map(o => [
    o.orderNumber,
    new Date(o.createdAt).toLocaleDateString("en-IN"),
    o.user.name || "Guest",
    o.user.phone,
    o.orderType,
    o.status,
    o.paymentStatus,
    o.items.map(i => `${i.productName} x${i.quantity}`).join("; "),
    o.grandTotal.toFixed(2),
    o.promoCode || "",
  ]);

  const csv = [headers, ...rows].map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="blissbakery-orders-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
