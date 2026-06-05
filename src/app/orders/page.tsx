"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { SiteHeader } from "@/components/shared/site-header";
import { useState, useEffect } from "react";
import { ArrowLeft, Package, Clock, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  cakeMessage: string | null;
  image: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  orderType: string;
  paymentStatus: string;
  itemTotal: number;
  deliveryCharge: number;
  packagingCharge: number;
  discount: number;
  tax: number;
  grandTotal: number;
  specialInstructions: string | null;
  deliveryAddress: string | null;
  promoCode: string | null;
  createdAt: string;
  items: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: "Order Placed", color: "bg-amber-50 text-amber-700 border-amber-200", icon: "🕐" },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "✅" },
  PREPARING: { label: "Being Prepared", color: "bg-orange-50 text-orange-700 border-orange-200", icon: "👨‍🍳" },
  READY: { label: "Ready for Pickup", color: "bg-green-50 text-green-700 border-green-200", icon: "📦" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-purple-50 text-purple-700 border-purple-200", icon: "🚗" },
  DELIVERED: { label: "Delivered", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "🎉" },
  PICKED_UP: { label: "Picked Up", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "🎉" },
  CANCELLED: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200", icon: "❌" },
};

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[order.status] || statusConfig.PENDING;
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Top: Status banner */}
      <div className={`px-4 py-2.5 flex items-center gap-2 text-xs font-semibold border-b ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
        <span className="ml-auto text-[10px] opacity-70 font-normal">
          {order.paymentStatus === "PAID" ? "Paid" : order.paymentStatus === "FAILED" ? "Payment Failed" : "Payment Pending"}
        </span>
      </div>

      {/* Order info row */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground font-mono">#{order.orderNumber}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground uppercase">
          {order.orderType === "DELIVERY" ? "🛵 Delivery" : "🏪 Pickup"}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-1">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-2 border-b border-dashed border-border last:border-0">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
              {item.image ? (
                <Image src={item.image} alt={item.productName} fill className="object-cover" sizes="56px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl bg-primary/5">🎂</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight">{item.productName}</p>
              {item.variantName && (
                <p className="text-[11px] text-muted-foreground">{item.variantName}</p>
              )}
              {item.cakeMessage && (
                <p className="text-[11px] text-primary italic">&ldquo;{item.cakeMessage}&rdquo;</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {formatPrice(item.unitPrice)} × {item.quantity}
              </p>
            </div>
            <span className="text-sm font-semibold text-foreground">{formatPrice(item.totalPrice)}</span>
          </div>
        ))}
      </div>

      {/* Total + expand */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{itemCount} item{itemCount > 1 ? "s" : ""}</span>
          <span className="text-base font-bold text-foreground">{formatPrice(order.grandTotal)}</span>
        </div>

        {/* Expand for bill details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:underline"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Hide details" : "View bill details"}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-dashed border-border space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Item Total</span>
              <span>{formatPrice(order.itemTotal)}</span>
            </div>
            {order.deliveryCharge > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>{formatPrice(order.deliveryCharge)}</span>
              </div>
            )}
            {order.packagingCharge > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Packaging</span>
                <span>{formatPrice(order.packagingCharge)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount {order.promoCode && `(${order.promoCode})`}</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>GST</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-foreground pt-1.5 border-t border-border text-sm">
              <span>Total</span>
              <span>{formatPrice(order.grandTotal)}</span>
            </div>

            {order.specialInstructions && (
              <div className="pt-2 mt-2 border-t border-dashed border-border">
                <p className="text-[11px] text-muted-foreground font-medium">Special Instructions</p>
                <p className="text-[11px] text-foreground">{order.specialInstructions}</p>
              </div>
            )}
            {order.deliveryAddress && (
              <div className="pt-2 mt-1 border-t border-dashed border-border">
                <p className="text-[11px] text-muted-foreground font-medium">Delivery Address</p>
                <p className="text-[11px] text-foreground">{order.deliveryAddress}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <SiteHeader />

      <div className="max-w-2xl mx-auto w-full px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="p-1 rounded-full hover:bg-muted transition-colors">
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
              <Link key={order.id} href={`/order/${order.id}`} className="block">
                <OrderCard order={order} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
