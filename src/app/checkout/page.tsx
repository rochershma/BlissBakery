"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useAuth } from "@/components/auth/auth-provider";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft, Tag, MapPin, Clock, CreditCard, ShieldCheck, Leaf, ChefHat } from "lucide-react";
import { SiteHeader } from "@/components/shared/site-header";
import { useToast } from "@/components/shared/toast";

function ProgressBar() {
  return (
    <div className="flex items-center justify-center gap-0 py-3">
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">✓</div>
        <span className="text-[11px] font-medium text-primary">Cart</span>
      </div>
      <div className="w-8 h-0.5 bg-primary mx-1" />
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">2</div>
        <span className="text-[11px] font-bold text-primary">Checkout</span>
      </div>
      <div className="w-8 h-0.5 bg-gray-200 mx-1" />
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 text-[10px] font-bold flex items-center justify-center">3</div>
        <span className="text-[11px] text-muted-foreground">Payment</span>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading, setShowLoginModal } = useAuth();
  const {
    items,
    storeSlug,
    orderType,
    setOrderType,
    specialInstructions,
    getItemCount,
    getSubtotal,
  } = useCartStore();

  const [hydrated, setHydrated] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [storeConfig, setStoreConfig] = useState({ packagingCharge: 15, deliveryCharge: 30, gstRate: 5, minDeliveryOrder: 200 });
  const [availablePromos, setAvailablePromos] = useState<{ code: string; discountType: string; discountValue: number; occasionTag: string | null }[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliverySlot, setDeliverySlot] = useState("");
  const { toast } = useToast();

  useEffect(() => setHydrated(true), []);

  // Fetch store config (charges from DB)
  useEffect(() => {
    fetch("/api/store/config").then(r => r.json()).then(data => {
      if (data.packagingCharge !== undefined) setStoreConfig(data);
    }).catch(() => {});
    // Fetch available promos
    fetch("/api/promo/list").then(r => r.json()).then(data => {
      if (data.promos) setAvailablePromos(data.promos);
    }).catch(() => {});
  }, []);

  // Trigger login if not authenticated
  useEffect(() => {
    if (hydrated && !authLoading && !user) {
      setShowLoginModal(true);
    }
  }, [hydrated, authLoading, user, setShowLoginModal]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  if (itemCount === 0) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-foreground font-serif mb-2">Your cart is empty</h2>
        <Link href="/" className="text-primary font-medium hover:underline">Go back to menu</Link>
      </div>
    );
  }

  const packagingCharge = storeConfig.packagingCharge;
  const deliveryCharge = orderType === "DELIVERY" ? storeConfig.deliveryCharge : 0;
  const discount = promoApplied?.discount || 0;
  const taxableAmount = subtotal + packagingCharge + deliveryCharge - discount;
  const gst = Math.round(taxableAmount * (storeConfig.gstRate / 100) * 100) / 100;
  const grandTotal = taxableAmount + gst;

  async function handleApplyPromo() {
    if (!promoCode.trim()) return;
    if (!user) {
      setShowLoginModal(true);
      setPromoError("Login to apply promo codes");
      return;
    }
    setPromoError("");
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, subtotal }),
      });
      const data = await res.json();
      if (data.success) {
        setPromoApplied({ code: data.code, discount: data.discount });
      } else {
        setPromoError(data.message || "Invalid promo code");
      }
    } catch {
      setPromoError("Failed to validate promo code");
    }
  }

  async function handlePaySecurely() {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (orderType === "DELIVERY" && !deliveryAddress.trim()) {
      toast("Please enter your delivery address", "error");
      return;
    }
    if (orderType === "DELIVERY" && subtotal < storeConfig.minDeliveryOrder) {
      toast(`Minimum order for delivery is ₹${storeConfig.minDeliveryOrder}`, "error");
      return;
    }
    setProcessing(true);

    try {
      // Generate idempotency key to prevent double-submit
      const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Step 1: Create order
      const orderRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          storeSlug: storeSlug || "kuchaman-city",
          orderType,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            addOns: item.addOns,
            flavour: item.flavour,
            cakeMessage: item.cakeMessage,
            occasion: item.occasion,
            recipientName: item.recipientName,
            recipientAge: item.recipientAge,
          })),
          specialInstructions,
          promoCode: promoApplied?.code,
          deliveryAddress: orderType === "DELIVERY" ? deliveryAddress : undefined,
          deliveryDate: deliveryDate || undefined,
          deliverySlot: deliverySlot || undefined,
        }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        toast(orderData.message || "Failed to create order", "error");
        setProcessing(false);
        return;
      }

      // Step 2: Simulate payment (replace with Razorpay in production)
      const payRes = await fetch("/api/payments/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderData.order.id, simulateStatus: "PAID" }),
      });
      const payData = await payRes.json();

      if (payData.success) {
        // Clear cart and redirect to order confirmation
        const { clearCart } = await import("@/store/cart").then(m => m.useCartStore.getState());
        clearCart();
        window.location.href = `/order/${orderData.order.id}`;
      } else {
        toast(payData.message || "Payment failed", "error");
      }
    } catch (err) {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setProcessing(false);
    }
  }

  // Show login prompt overlay if not logged in
  if (!user && !authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <SiteHeader />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground font-serif mb-2">Login to Continue</h2>
          <p className="text-muted-foreground mb-6 max-w-xs">
            Sign in with your phone number to place your order securely
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold hover:bg-primary-hover transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      {/* Checkout breadcrumb + Progress */}
      <div className="bg-white border-b border-border px-4 py-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <Link href="/cart" className="text-primary hover:underline flex items-center gap-1 text-xs"><ArrowLeft className="w-3 h-3" /> Back to Cart</Link>
            {user && <span className="text-xs text-muted-foreground">{user.name || user.phone}</span>}
          </div>
          <ProgressBar />
        </div>
      </div>

      {/* Trust badges */}
      <div className="bg-gradient-to-r from-green-50 to-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-center gap-4 md:gap-8 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Leaf className="w-3 h-3 text-green-600" /> 100% Veg & Eggless</span>
          <span className="flex items-center gap-1"><ChefHat className="w-3 h-3 text-primary" /> Baked Fresh</span>
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-blue-600" /> Secure Checkout</span>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 pb-32">
        <div className="md:flex md:gap-6">
        <div className="md:flex-1">
        {/* Order Summary */}
        <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
          <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center justify-between">
            <h2 className="label-premium text-foreground">Order Summary</h2>
            <span className="text-xs text-muted-foreground">{itemCount} items</span>
          </div>
          <div className="divide-y divide-border">
            {items.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="px-4 py-2.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm bg-primary/5">🎂</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate font-medium">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.variantName && `${item.variantName}`}
                    {item.flavour && ` · ${item.flavour}`}
                    {` × ${item.quantity}`}
                  </p>
                </div>
                <span className="text-sm font-semibold text-foreground flex-shrink-0">
                  {formatPrice((item.unitPrice + (item.addOns || []).reduce((s, a) => s + a.price, 0)) * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Type */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h2 className="label-premium text-foreground mb-3">Order Type</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setOrderType("PICKUP")}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                orderType === "PICKUP"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-foreground border-border hover:border-primary/50"
              }`}
            >
              <MapPin className="w-4 h-4 inline mr-1" />
              Pick Up
            </button>
            <button
              onClick={() => setOrderType("DELIVERY")}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                orderType === "DELIVERY"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-foreground border-border hover:border-primary/50"
              }`}
            >
              🚗 Delivery
            </button>
          </div>
          {orderType === "PICKUP" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Bliss Bakery, Main Market, Kuchaman City</span>
            </div>
          )}
          {orderType === "DELIVERY" && (
            <div className="mt-3 bg-muted rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Delivery Address</p>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Full address with landmark, area, pincode..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none bg-white"
              />
              {orderType === "DELIVERY" && !deliveryAddress.trim() && (
                <p className="text-[10px] text-destructive">* Delivery address is required</p>
              )}
              <p className="text-[10px] text-muted-foreground">Delivery charge: {formatPrice(storeConfig.deliveryCharge)} · Min order: {formatPrice(storeConfig.minDeliveryOrder)}</p>
            </div>
          )}
        </div>

        {/* When do you want it? — Themed dropdowns */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h2 className="label-premium text-foreground mb-3">📅 When do you want it?</h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Date dropdown */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">Date</label>
              <div className="relative">
                <select
                  value={deliveryDate}
                  onChange={(e) => { setDeliveryDate(e.target.value); setDeliverySlot(""); }}
                  className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border-2 border-border bg-white text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
                >
                  <option value="">Select date...</option>
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    const iso = d.toISOString().split("T")[0];
                    const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "long" });
                    const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                    return <option key={iso} value={iso}>{dayName}, {dateStr}</option>;
                  })}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Time slot dropdown */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">Time Slot</label>
              <div className="relative">
                <select
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border-2 border-border bg-white text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
                >
                  <option value="">Select time...</option>
                  {(() => {
                    const now = new Date();
                    const isToday = deliveryDate === now.toISOString().split("T")[0] || !deliveryDate;
                    const currentHour = now.getHours();
                    const slots = [
                      { label: "10 AM – 1 PM", value: "10am-1pm", startHour: 10 },
                      { label: "1 PM – 4 PM", value: "1pm-4pm", startHour: 13 },
                      { label: "4 PM – 7 PM", value: "4pm-7pm", startHour: 16 },
                      { label: "7 PM – 10 PM", value: "7pm-10pm", startHour: 19 },
                    ];
                    return slots
                      .filter((s) => !isToday || s.startHour >= currentHour + 2)
                      .map((s) => <option key={s.value} value={s.value}>{s.label}</option>);
                  })()}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Orders need ~2 hours prep time. Store hours: 10 AM – 10 PM.</p>
        </div>

        {/* Promo Code */}
        <div className="bg-white rounded-2xl border border-border p-4 mb-4">
          <h2 className="label-premium text-foreground mb-3 flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-primary" />
            Savings Corner
          </h2>
          {promoApplied ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-green-800">{promoApplied.code} applied!</p>
                <p className="text-xs text-green-600">You saved {formatPrice(promoApplied.discount)}</p>
              </div>
              <button
                onClick={() => setPromoApplied(null)}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="text-xs text-destructive mt-2">{promoError}</p>}
              {!user && (
                <p className="text-xs text-muted-foreground mt-2">
                  🔒 <button onClick={() => setShowLoginModal(true)} className="text-primary hover:underline">Login</button> to unlock promo codes
                </p>
              )}
              {/* Available promos */}
              {availablePromos.length > 0 && !promoApplied && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Available Offers</p>
                  {availablePromos.map((p) => (
                    <button
                      key={p.code}
                      onClick={() => { setPromoCode(p.code); }}
                      className="w-full text-left flex items-center justify-between p-2 rounded-lg border border-dashed border-primary/30 hover:bg-primary/5 transition-colors"
                    >
                      <div>
                        <span className="font-mono font-bold text-xs text-primary">{p.code}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">
                          {p.discountType === "PERCENTAGE" ? `${p.discountValue}% off` : `₹${p.discountValue} off`}
                        </span>
                      </div>
                      <span className="text-[10px] text-primary font-medium">TAP TO USE</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bill Details */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4 md:hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <h2 className="label-premium text-foreground">Bill Details</h2>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Item Total</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            {deliveryCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium">{formatPrice(deliveryCharge)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Packaging</span>
              <span className="font-medium">{formatPrice(packagingCharge)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({promoApplied?.code})</span>
                <span className="font-medium">-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST ({storeConfig.gstRate}%)</span>
              <span className="font-medium">{formatPrice(gst)}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between">
              <span className="font-bold text-foreground">Grand Total</span>
              <span className="font-bold text-lg text-foreground">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Marketing Opt-in */}
        <label className="flex items-start gap-3 bg-white rounded-2xl border border-border p-4 mb-4 cursor-pointer">
          <input type="checkbox" defaultChecked className="mt-0.5 accent-primary w-4 h-4" />
          <span className="text-xs text-muted-foreground">
            Yes, I&apos;d like to receive updates and exclusive offers from Bliss Bakery on WhatsApp
          </span>
        </label>

        <p className="text-xs text-muted-foreground text-center mb-4">
          ⚠️ Orders once placed cannot be cancelled and are non-refundable
        </p>
        </div>{/* end md:flex-1 */}

        {/* RIGHT COLUMN — Bill (sticky on desktop) */}
        <div className="hidden md:block md:w-80 md:flex-shrink-0">
          <div className="sticky top-4 space-y-4">
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="px-4 py-3 bg-muted/50 border-b border-border">
                <h2 className="label-premium text-foreground">Bill Details</h2>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Item Total</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {deliveryCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-medium">{formatPrice(deliveryCharge)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Packaging</span>
                  <span className="font-medium">{formatPrice(packagingCharge)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({promoApplied?.code})</span>
                    <span className="font-medium">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST ({storeConfig.gstRate}%)</span>
                  <span className="font-medium">{formatPrice(gst)}</span>
                </div>
                <div className="border-t border-border pt-2 mt-2 flex justify-between">
                  <span className="font-bold text-foreground">Grand Total</span>
                  <span className="font-bold text-lg text-foreground">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">⚠️ Non-refundable once placed</p>
          </div>
        </div>
        </div>{/* end md:flex */}
      </main>

      {/* Sticky Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <button
            onClick={handlePaySecurely}
            disabled={processing}
            className="flex items-center justify-between bg-primary text-primary-foreground rounded-2xl px-5 py-3.5 hover:bg-primary-hover transition-colors w-full disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span className="font-bold text-lg">{formatPrice(grandTotal)}</span>
            </div>
            <span className="flex items-center gap-1 font-semibold">
              {processing ? "Processing..." : "Pay Securely →"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
