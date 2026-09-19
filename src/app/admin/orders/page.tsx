import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Clock, Phone, MapPin, MessageCircle, Search, Download } from "lucide-react";

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { q: query, status: statusFilter } = await searchParams;

  const orders = await db.order.findMany({
    where: {
      ...(query ? {
        OR: [
          { orderNumber: { contains: query } },
          { user: { name: { contains: query } } },
          { user: { phone: { contains: query } } },
        ],
      } : {}),
      ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      items: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
    take: 50,
  });

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
    PREPARING: "bg-orange-100 text-orange-800 border-orange-200",
    READY: "bg-green-100 text-green-800 border-green-200",
    OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800 border-purple-200",
    DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    PICKED_UP: "bg-emerald-100 text-emerald-800 border-emerald-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
  };

  const paymentColors: Record<string, string> = {
    PENDING: "text-yellow-600",
    PAID: "text-green-600",
    FAILED: "text-red-600",
    REFUNDED: "text-purple-600",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Orders</h1>
          <p className="text-sm text-muted-foreground">{orders.length} orders</p>
        </div>
        <a
          href="/api/admin/orders/export"
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      {/* Search & Filter */}
      <form className="mb-4 flex flex-col sm:flex-row gap-2" action="/admin/orders" method="GET">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            name="q"
            defaultValue={query || ""}
            placeholder="Search by order #, name, phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select name="status" defaultValue={statusFilter || "ALL"} className="px-3 py-2.5 border border-border rounded-xl text-sm bg-white">
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PREPARING">Preparing</option>
          <option value="READY">Ready</option>
          <option value="DELIVERED">Delivered</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button type="submit" className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium">Search</button>
      </form>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-muted-foreground">No orders yet. They&apos;ll appear here when customers order.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-border overflow-hidden">
              {/* Order Header */}
              <Link href={`/admin/orders/${order.id}`} className="block px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    #{order.orderNumber.slice(-4)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {order.user.name || "Guest"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <Phone className="w-3 h-3 flex-shrink-0" /> {order.user.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                  <p className={`text-[10px] mt-1 font-medium ${paymentColors[order.paymentStatus]}`}>
                    💳 {order.paymentStatus}
                  </p>
                </div>
                </div>
              </Link>

              {/* Order Items */}
              <div className="px-4 py-3 bg-muted/20">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-0.5">
                    <span className="text-foreground">
                      {item.productName} {item.variantName ? `(${item.variantName})` : ""} × {item.quantity}
                    </span>
                    <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
                {order.specialInstructions && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    📝 {order.specialInstructions}
                  </p>
                )}
              </div>

              {/* Order Footer */}
              <div className="px-4 py-3 flex items-center justify-between border-t border-border">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {order.orderType}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{formatPrice(order.grandTotal)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
