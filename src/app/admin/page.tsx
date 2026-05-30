import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ShoppingCart, TrendingUp, Users, Package, ArrowRight, Clock } from "lucide-react";

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayOrders, totalOrders, totalCustomers, totalProducts, recentOrders] =
    await Promise.all([
      db.order.count({ where: { createdAt: { gte: today } } }),
      db.order.count(),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.product.count(),
      db.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: true, items: true },
      }),
    ]);

  const todayRevenue = await db.order.aggregate({
    where: { createdAt: { gte: today }, paymentStatus: "PAID" },
    _sum: { grandTotal: true },
  });

  const stats = [
    { label: "Today's Orders", value: todayOrders.toString(), icon: ShoppingCart, color: "text-primary" },
    { label: "Today's Revenue", value: formatPrice(todayRevenue._sum.grandTotal || 0), icon: TrendingUp, color: "text-success" },
    { label: "Total Customers", value: totalCustomers.toString(), icon: Users, color: "text-accent" },
    { label: "Products", value: totalProducts.toString(), icon: Package, color: "text-muted-foreground" },
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
                      {order.items.length} items · {formatPrice(order.grandTotal)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-gray-100"}`}>
                    {order.status}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
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
