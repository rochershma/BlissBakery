import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Phone, MessageCircle, MapPin, Clock, CreditCard } from "lucide-react";
import { OrderStatusUpdater } from "../order-status-updater";

interface Props {
  params: Promise<{ id: string }>;
}

const paymentColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: true,
      store: true,
      items: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) return notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/orders" className="p-1 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground font-serif">Order #{order.orderNumber}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column — order details */}
        <div className="md:col-span-2 space-y-4">
          {/* Status Updater */}
          <div className="bg-white rounded-xl border border-border p-4">
            <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
              <h2 className="label-premium text-foreground">Order Items</h2>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="px-4 py-2.5 flex justify-between text-sm">
                  <div>
                    <span className="font-medium text-foreground">{item.productName}</span>
                    {item.variantName && <span className="text-muted-foreground"> ({item.variantName})</span>}
                    <span className="text-muted-foreground"> × {item.quantity}</span>
                  </div>
                  <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            {order.specialInstructions && (
              <div className="px-4 py-2.5 bg-yellow-50 border-t border-yellow-100 text-xs text-yellow-800">
                📝 <strong>Instructions:</strong> {order.specialInstructions}
              </div>
            )}
          </div>

          {/* Bill */}
          <div className="bg-white rounded-xl border border-border p-4 space-y-1.5 text-sm">
            <h2 className="label-premium text-foreground mb-2">Bill Details</h2>
            <div className="flex justify-between"><span className="text-muted-foreground">Item Total</span><span>{formatPrice(order.itemTotal)}</span></div>
            {order.deliveryCharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatPrice(order.deliveryCharge)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Packaging</span><span>{formatPrice(order.packagingCharge)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount {order.promoCode ? `(${order.promoCode})` : ""}</span><span>-{formatPrice(order.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span>{formatPrice(order.tax)}</span></div>
            <div className="flex justify-between font-bold border-t border-border pt-2 mt-2"><span>Grand Total</span><span>{formatPrice(order.grandTotal)}</span></div>
          </div>

          {/* Status History */}
          {order.statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-4">
              <h2 className="label-premium text-foreground mb-3">Status History</h2>
              <div className="space-y-2">
                {order.statusHistory.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-medium text-foreground">{log.status}</span>
                      {log.notifiedCustomer && <span className="text-green-600">🔔 Notified</span>}
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — customer + payment info */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-border p-4">
            <h2 className="label-premium text-foreground mb-3">Customer</h2>
            <p className="font-semibold text-foreground text-sm">{order.user.name || "Guest"}</p>
            <div className="mt-2 space-y-2">
              <a href={`tel:${order.user.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-3.5 h-3.5" /> +91 {order.user.phone}
              </a>
              <a href={`https://wa.me/91${order.user.phone}`} target="_blank" rel="noopener" className="flex items-center gap-2 text-xs text-green-600 hover:text-green-700 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-xl border border-border p-4">
            <h2 className="label-premium text-foreground mb-3">Order Info</h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {order.orderType === "PICKUP" ? "Pickup from store" : (order.deliveryAddress || "Delivery address N/A")}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {order.orderType}
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-primary" />
                <span className={`font-medium px-2 py-0.5 rounded-full text-[10px] ${paymentColors[order.paymentStatus]}`}>
                  {order.paymentStatus}
                </span>
                {order.paymentId && <span className="text-muted-foreground text-[10px]">{order.paymentId}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
