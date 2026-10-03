import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ShoppingCart, TrendingUp, Users, ArrowRight, Clock, MapPin, Store as StoreIcon } from "lucide-react";
import { requireActiveStore } from "@/lib/active-store";
import { localIso, parseSlots } from "@/lib/slots";

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const store = await requireActiveStore();
  // Customers are shared accounts, so "customers" here means people who have
  // actually ordered from this store.
  const storeOrders = { storeId: store.id };

  const [todayOrders, totalCustomers, recentOrders] =
    await Promise.all([
      db.order.count({ where: { ...storeOrders, createdAt: { gte: today } } }),
      db.order.findMany({ where: storeOrders, distinct: ["userId"], select: { userId: true } }).then((r) => r.length),
      db.order.findMany({
        where: storeOrders,
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: true, items: true },
      }),
    ]);

  const todayRevenue = await db.order.aggregate({
    where: { ...storeOrders, createdAt: { gte: today }, status: { not: "CANCELLED" } },
    _sum: { grandTotal: true },
  });

  // What the kitchen has to hand over today, in slot order.
  const [awaiting, dueToday, slotRow] = await Promise.all([
    db.order.count({ where: { ...storeOrders, status: "PENDING" } }),
    db.order.findMany({
      where: {
        ...storeOrders,
        deliveryDate: new Date(localIso()),
        status: { notIn: ["CANCELLED", "DELIVERED", "PICKED_UP"] },
      },
      include: { user: true, items: true },
      orderBy: { createdAt: "asc" },
    }),
    db.store.findUnique({ where: { id: store.id }, select: { deliverySlots: true } }),
  ]);
  const slotStart = (s: string | null) => parseSlots(slotRow?.deliverySlots).find((x) => x.label === s)?.start ?? "99:99";
  dueToday.sort((a, b) => slotStart(a.deliverySlot).localeCompare(slotStart(b.deliverySlot)));

  const stats = [
    { label: "Today's Orders", value: todayOrders.toString(), icon: ShoppingCart, color: "text-primary" },
    { label: "Today's Sales", value: formatPrice(todayRevenue._sum.grandTotal || 0), icon: TrendingUp, color: "text-success" },
    { label: "Awaiting confirmation", value: awaiting.toString(), icon: Clock, color: awaiting ? "text-primary" : "text-muted-foreground" },
    { label: "Total Customers", value: totalCustomers.toString(), icon: Users, color: "text-accent" },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-orange-100 text-orange-800",
    READY: "bg-green-100 text-green-800",
    OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    PICKED_UP: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <Link
          href="/admin/orders"
          className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          View Orders <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Due today */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Due today · {dueToday.length}</h2>
          <span className="text-xs text-muted-foreground">by slot</span>
        </div>
        {dueToday.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Nothing left to hand over today.</p>
        ) : (
          <div className="divide-y divide-border">
            {dueToday.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <span className="text-xs font-semibold text-foreground w-24 flex-none">{o.deliverySlot || "No slot"}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-foreground truncate">
                    {o.items.map((i) => `${i.productName}${i.variantName ? ` (${i.variantName})` : ""} × ${i.quantity}`).join(", ")}
                  </span>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    {o.orderType === "PICKUP" ? <StoreIcon className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {o.orderType === "PICKUP" ? "Pickup" : "Delivery"} · {o.user.name || o.user.phone}
                  </span>
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[o.status] || "bg-gray-100"}`}>
                  {o.status.replace(/_/g, " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-primary hover:underline">
            View All →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No orders yet. They&apos;ll show up here once customers start ordering!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {order.orderNumber.slice(-3)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {order.user.name || order.user.phone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"} · {formatPrice(order.grandTotal)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-gray-100"}`}>
                    {order.status}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      ...(new Date(order.createdAt) < today ? { day: "numeric", month: "short" } : {}),
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
