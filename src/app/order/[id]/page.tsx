import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { SiteHeader } from "@/components/shared/site-header";
import { CheckCircle, Clock, Phone, MessageCircle, RotateCcw, MapPin } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const statusSteps = [
  { key: "CONFIRMED", label: "Confirmed", icon: "✅" },
  { key: "PREPARING", label: "Preparing", icon: "👨‍🍳" },
  { key: "READY", label: "Ready", icon: "📦" },
  { key: "DELIVERED", label: "Delivered", icon: "🎉" },
  { key: "PICKED_UP", label: "Picked Up", icon: "🎉" },
];

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-green-100 text-green-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  PICKED_UP: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, user: true, store: true, statusHistory: { orderBy: { createdAt: "desc" } } },
  });

  if (!order) return notFound();

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);
  const isPickup = order.orderType === "PICKUP";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <main className="max-w-2xl mx-auto w-full px-4 py-6 page-enter">
        {/* Success Header */}
        {order.paymentStatus === "PAID" && (
          <div className="text-center mb-6 animate-fade-in-up">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-xl font-bold text-foreground font-serif">Order Placed Successfully!</h1>
            <p className="text-sm text-muted-foreground mt-1">Order #{order.orderNumber}</p>
          </div>
        )}

        {order.paymentStatus === "FAILED" && (
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">❌</div>
            <h1 className="text-xl font-bold text-destructive font-serif">Payment Failed</h1>
            <p className="text-sm text-muted-foreground mt-1">Order #{order.orderNumber}</p>
          </div>
        )}

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl border border-border p-5 mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">ORDER STATUS</h2>
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
            <div className="absolute top-4 left-4 h-0.5 bg-primary transition-all" style={{ width: `${Math.max(0, currentStepIndex) / (statusSteps.length - 1) * 100}%` }} />

            {statusSteps.filter(s => isPickup ? s.key !== "DELIVERED" : s.key !== "PICKED_UP").map((step, i) => {
              const isActive = currentStepIndex >= i;
              const isCurrent = statusSteps[currentStepIndex]?.key === step.key;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} ${isCurrent ? "ring-2 ring-primary/30 ring-offset-2" : ""}`}>
                    {step.icon}
                  </div>
                  <span className={`text-[10px] mt-1 ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[order.status]}`}>
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">ORDER SUMMARY</h2>
          </div>
          <div className="px-4 py-3 divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between py-2 text-sm">
                <span>{item.productName} {item.variantName ? `(${item.variantName})` : ""} × {item.quantity}</span>
                <span className="font-medium">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Item Total</span><span>{formatPrice(order.itemTotal)}</span></div>
            {order.deliveryCharge > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery</span><span>{formatPrice(order.deliveryCharge)}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Packaging</span><span>{formatPrice(order.packagingCharge)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST</span><span>{formatPrice(order.tax)}</span></div>
            <div className="flex justify-between font-bold border-t border-border pt-2 mt-2"><span>Grand Total</span><span>{formatPrice(order.grandTotal)}</span></div>
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>{order.orderType}</span>
              <span>{order.paymentStatus === "PAID" ? "✅ Paid" : order.paymentStatus === "FAILED" ? "❌ Failed" : "⏳ Pending"}{order.paymentId ? ` · ${order.paymentId}` : ""}</span>
            </div>
          </div>
        </div>

        {/* Store Info */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-2">{isPickup ? "PICKUP FROM" : "DELIVERY TO"}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            {isPickup ? `${order.store.name}, ${order.store.address}` : (order.deliveryAddress || "Address not specified")}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-4">
          <a href={`tel:${order.store.phone}`} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors btn-press">
            <Phone className="w-4 h-4" /> Call Store
          </a>
          <a href={`https://wa.me/91${order.store.phone}`} target="_blank" rel="noopener" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors btn-press">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        </div>

        <Link href="/" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors btn-press w-full">
          <RotateCcw className="w-4 h-4" /> Order Again
        </Link>
      </main>
    </div>
  );
}
