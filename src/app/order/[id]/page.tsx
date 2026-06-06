import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import { SiteHeader } from "@/components/shared/site-header";
import { CheckCircle, Phone, MessageCircle, RotateCcw, MapPin, ArrowLeft, Copy, ChevronDown, Clock, Truck, Package, XCircle, ChefHat } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Order Placed", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  CONFIRMED: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  PREPARING: { label: "Being Prepared", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  READY: { label: "Ready", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  DELIVERED: { label: "Delivered", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  PICKED_UP: { label: "Picked Up", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { images: true, slug: true } } } },
      user: true,
      store: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) return notFound();

  const config = statusConfig[order.status] || statusConfig.PENDING;
  const isPickup = order.orderType === "PICKUP";
  const orderDate = new Date(order.createdAt);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <SiteHeader />

      <main className="max-w-2xl mx-auto w-full px-4 py-5">
        {/* Back + Order Number */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/orders" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> My Orders
          </Link>
          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">#{order.orderNumber}</span>
        </div>

        {/* Success Animation (only for fresh orders) */}
        {order.paymentStatus === "PAID" && (
          <div className="text-center mb-5 animate-fade-in-up">
            <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-success" />
            </div>
            <h1 className="text-lg font-bold text-foreground font-serif">Order Placed!</h1>
          </div>
        )}

        {order.paymentStatus === "FAILED" && (
          <div className="text-center mb-5">
            <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="w-7 h-7 text-destructive" />
            </div>
            <h1 className="text-lg font-bold text-destructive font-serif">Payment Failed</h1>
          </div>
        )}

        {/* Status Card */}
        <div className={`rounded-2xl border p-4 mb-4 ${config.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}>
                {order.status === 'CANCELLED' ? <XCircle className="w-4 h-4" /> : order.status === 'DELIVERED' || order.status === 'PICKED_UP' ? <CheckCircle className="w-4 h-4" /> : order.status === 'PREPARING' ? <ChefHat className="w-4 h-4" /> : order.status === 'OUT_FOR_DELIVERY' ? <Truck className="w-4 h-4" /> : order.status === 'READY' ? <Package className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div>
                <p className={`text-sm font-bold ${config.color}`}>{config.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {orderDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at {orderDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-white/60 backdrop-blur-sm px-2 py-1 rounded-full text-muted-foreground uppercase font-medium">
              {isPickup ? "Pickup" : "Delivery"}
            </span>
          </div>
        </div>

        {/* Items with Images */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-bold text-foreground font-serif">Items Ordered</h2>
          </div>
          <div className="divide-y divide-dashed divide-border">
            {order.items.map((item) => {
              const images = parseJsonSafe<string[]>(item.product?.images, []);
              const img = images[0] || null;
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={item.product?.slug ? `/store/kuchaman-city/menu/${item.product.slug}` : '/store/kuchaman-city/menu'} className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                    {img ? (
                      <Image src={img} alt={item.productName} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-blush">
                        <Package className="w-5 h-5 text-primary/30" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={item.product?.slug ? `/store/kuchaman-city/menu/${item.product.slug}` : '/store/kuchaman-city/menu'} className="text-sm font-medium text-foreground leading-tight hover:text-primary transition-colors">{item.productName}</Link>
                    <p className="text-[11px] text-muted-foreground">
                      {item.variantName && `${item.variantName}`}
                      {item.flavour && ` · ${item.flavour}`}
                      {` × ${item.quantity}`}
                    </p>
                    {item.cakeMessage && (
                      <p className="text-[11px] text-primary italic mt-0.5">&ldquo;{item.cakeMessage}&rdquo;</p>
                    )}
                    {(item.occasion || item.recipientName) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {item.occasion && <span className="capitalize">{item.occasion}</span>}
                        {item.recipientName && <span> for {item.recipientName}</span>}
                        {item.recipientAge && <span> ({item.recipientAge} yrs)</span>}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatPrice(item.totalPrice)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-bold text-foreground font-serif">Bill Summary</h2>
          </div>
          <div className="px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Item Total</span><span>{formatPrice(order.itemTotal)}</span></div>
            {order.deliveryCharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatPrice(order.deliveryCharge)}</span></div>}
            {order.packagingCharge > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Safe Cake Packaging</span><span>{formatPrice(order.packagingCharge)}</span></div>}
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount {order.promoCode && `(${order.promoCode})`}</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            {order.tax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span>{formatPrice(order.tax)}</span></div>}
            <div className="flex justify-between font-bold border-t border-border pt-2 mt-2 text-base">
              <span>Total Paid</span><span>{formatPrice(order.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h2 className="text-sm font-bold text-foreground font-serif mb-2">Payment</h2>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span>{order.paymentStatus === "PAID" ? <CheckCircle className="w-4 h-4 text-green-600 inline" /> : order.paymentStatus === "FAILED" ? <XCircle className="w-4 h-4 text-red-600 inline" /> : <Clock className="w-4 h-4 text-amber-600 inline" />}</span>
              <span className="text-foreground font-medium">{order.paymentStatus === "PAID" ? "Paid" : order.paymentStatus}</span>
            </div>
            {order.paymentId && <span className="text-xs font-mono text-muted-foreground">{order.paymentId}</span>}
          </div>
        </div>

        {/* Pickup / Delivery Info */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h2 className="text-sm font-bold text-foreground font-serif mb-2">
            {isPickup ? "Pickup Location" : "Delivery Address"}
          </h2>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span>{isPickup ? `${order.store.name}, ${order.store.address}, ${order.store.city}` : (order.deliveryAddress || "Address not specified")}</span>
          </div>
          {order.specialInstructions && (
            <div className="mt-3 pt-3 border-t border-dashed border-border">
              <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Special Instructions</p>
              <p className="text-sm text-foreground">{order.specialInstructions}</p>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-bold text-foreground font-serif">Need Help?</h2>
          </div>
          <div className="flex">
            <a
              href={`tel:${order.store.phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-foreground hover:bg-muted transition-colors border-r border-border"
            >
              <Phone className="w-4 h-4 text-primary" /> Call Store
            </a>
            <a
              href={`https://wa.me/91${order.store.phone}?text=Hi, I have a query about order ${order.orderNumber}`}
              target="_blank"
              rel="noopener"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>

        {/* Order Again */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors btn-press w-full"
        >
          <RotateCcw className="w-4 h-4" /> Order Again
        </Link>
      </main>
    </div>
  );
}
