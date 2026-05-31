"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { SiteHeader } from "@/components/shared/site-header";
import { useState, useEffect } from "react";
import { ArrowLeft, Package, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  orderType: string;
  paymentStatus: string;
  grandTotal: number;
  createdAt: string;
  items: OrderItem[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-green-100 text-green-800",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  PICKED_UP: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "Order Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Being Prepared",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  PICKED_UP: "Picked Up",
  CANCELLED: "Cancelled",
};

export default function OrdersPage() {
  const { user, loading, setShowLoginModal } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      setShowLoginModal(true);
    }
  }, [loading, user, setShowLoginModal]);

  useEffect(() => {
    if (user) {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setOrders(data.orders);
        })
        .finally(() => setFetching(false));
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-2xl mx-auto w-full px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-1 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-foreground font-serif">My Orders</h1>
        </div>

        {fetching ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-bold text-foreground font-serif mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Your order history will appear here</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary-hover transition-colors"
            >
              <Package className="w-5 h-5" />
              Start Ordering
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                {/* Order Header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                  <div>
                    <p className="text-sm font-bold text-foreground">#{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.paymentStatus === "PAID" ? "✅ Paid" : order.paymentStatus === "FAILED" ? "❌ Failed" : "⏳ Pending"}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="px-4 py-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-1 text-sm">
                      <span className="text-foreground">
                        {item.productName} {item.variantName ? `(${item.variantName})` : ""} × {item.quantity}
                      </span>
                      <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-muted/30">
                  <span className="text-xs text-muted-foreground uppercase">{order.orderType}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">{formatPrice(order.grandTotal)}</span>
                    <button className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                      <RefreshCw className="w-3 h-3" /> Reorder
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
