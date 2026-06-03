import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
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
      items: { include: { product: true } },
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
              {order.items.map((item) => {
                const productImgs = parseJsonSafe<string[]>(item.product?.images, []);
                const productImg = productImgs[0] || null;
                const productSlug = item.product?.slug;
                const addOns = parseJsonSafe<{name:string;price:number}[]>((item as any).addOns, []);
                return (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex gap-3">
                    {/* Product image */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                      {productImg ? (
                        <Image src={productImg} alt={item.productName} fill className="object-cover" sizes="56px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl bg-primary/5">🎂</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          {productSlug ? (
                            <Link href={`/store/${order.store.slug}/menu/${productSlug}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                              {item.productName}
                            </Link>
                          ) : (
                            <span className="text-sm font-semibold text-foreground">{item.productName}</span>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {item.variantName && <span>{item.variantName}</span>}
                            <span>× {item.quantity}</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-foreground">{formatPrice(item.totalPrice)}</span>
                      </div>
                      {/* Customization details */}
                      {((item as any).flavour || (item as any).cakeMessage || (item as any).occasion) && (
                        <div className="mt-2 bg-primary/5 rounded-lg px-3 py-2 text-xs space-y-0.5">
                          {(item as any).flavour && <p>Flavour: <span className="font-medium">{(item as any).flavour}</span></p>}
                          {(item as any).cakeMessage && <p className="text-primary font-semibold">Message: “{(item as any).cakeMessage}”</p>}
                          {(item as any).occasion && <p>Occasion: <span className="capitalize font-medium">{(item as any).occasion}</span></p>}
                          {(item as any).recipientAge && <p>Age: <span className="font-medium">{(item as any).recipientAge}</span></p>}
                        </div>
                      )}
                      {/* Add-ons */}
                      {addOns.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {addOns.map((a, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>🎁 {a.name}</span>
                              <span>+{formatPrice(a.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
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
              {(order as any).deliveryDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Scheduled: {new Date((order as any).deliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {(order as any).deliverySlot && <span className="capitalize"> ({(order as any).deliverySlot})</span>}
                </div>
              )}
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
