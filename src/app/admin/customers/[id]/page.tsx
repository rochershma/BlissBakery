import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, MapPin, ShoppingBag, Calendar, Clock, Package, User } from "lucide-react";
import Image from "next/image";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { id } = await params;

  const customer = await db.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          items: { select: { productName: true, quantity: true, totalPrice: true } },
        },
      },
      addresses: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) return notFound();

  const totalSpent = customer.orders.reduce((s, o) => s + o.grandTotal, 0);
  const totalOrders = customer.orders.length;
  const lastOrder = customer.orders[0];
  const joinDate = new Date(customer.createdAt);

  return (
    <div>
      {/* Back */}
      <Link href="/admin/customers" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> All Customers
      </Link>

      {/* Customer Header */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
            {(customer.name || customer.phone)[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground font-serif">{customer.name || "Unnamed Customer"}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> +91 {customer.phone}</span>
              {customer.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {customer.email}</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              Joined {joinDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              <span className="text-primary font-medium ml-2">{customer.role}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{totalOrders}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Orders</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{formatPrice(totalSpent)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Spent</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{totalOrders > 0 ? formatPrice(totalSpent / totalOrders) : "—"}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Order</p>
          </div>
        </div>
      </div>

      {/* Saved Addresses */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold text-foreground font-serif flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Saved Addresses ({customer.addresses.length})
          </h2>
        </div>
        {customer.addresses.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No saved addresses</p>
        ) : (
          <div className="divide-y divide-border">
            {customer.addresses.map((addr) => (
              <div key={addr.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary">{addr.label}</span>
                  <span className="text-[10px] text-muted-foreground">{addr.pincode}</span>
                </div>
                <p className="text-sm text-foreground">{addr.fullAddress}</p>
                {addr.landmark && <p className="text-xs text-muted-foreground mt-0.5">Landmark: {addr.landmark}</p>}
                <p className="text-xs text-muted-foreground">{[addr.city, addr.state].filter(Boolean).join(", ")}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold text-foreground font-serif flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" /> Recent Orders ({totalOrders})
          </h2>
        </div>
        {customer.orders.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">No orders yet</p>
        ) : (
          <div className="divide-y divide-border">
            {customer.orders.map((order) => {
              const orderDate = new Date(order.createdAt);
              return (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="block px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground">#{order.orderNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === "DELIVERED" || order.status === "PICKED_UP" ? "bg-green-50 text-green-700" :
                      order.status === "CANCELLED" ? "bg-red-50 text-red-700" :
                      order.status === "PREPARING" ? "bg-orange-50 text-orange-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>{order.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">
                        {order.items.map(i => `${i.productName} x${i.quantity}`).join(", ").slice(0, 50)}
                        {order.items.map(i => `${i.productName} x${i.quantity}`).join(", ").length > 50 ? "..." : ""}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {orderDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {order.orderType}
                        {order.paymentStatus === "PAID" ? " · Paid" : ""}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-foreground">{formatPrice(order.grandTotal)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
