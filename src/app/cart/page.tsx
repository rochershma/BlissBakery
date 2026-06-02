"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, MessageSquare, Home } from "lucide-react";
import { useState, useEffect } from "react";

export default function CartPage() {
  const [hydrated, setHydrated] = useState(false);
  const [storeConfig, setStoreConfig] = useState({ packagingCharge: 15, gstRate: 0 });
  useEffect(() => {
    setHydrated(true);
    fetch("/api/store/config").then(r => r.json()).then(data => {
      if (data.packagingCharge !== undefined) setStoreConfig({ packagingCharge: data.packagingCharge ?? 15, gstRate: data.gstRate ?? 0 });
    }).catch(() => {});
  }, []);

  const {
    items,
    storeSlug,
    specialInstructions,
    setSpecialInstructions,
    updateQuantity,
    removeItem,
    getItemCount,
    getSubtotal,
    clearCart,
  } = useCartStore();

  const [showInstructions, setShowInstructions] = useState(false);
  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/" className="p-1 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base font-bold text-foreground">Your Cart</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-32 h-32 mb-6 rounded-full bg-primary/5 flex items-center justify-center">
            <span className="text-6xl">🧁</span>
          </div>
          <h2 className="text-xl font-bold text-foreground font-serif mb-2">Your cart is feeling light!</h2>
          <p className="text-muted-foreground mb-8 max-w-xs">Looks like you haven&apos;t added any treats yet. Explore our freshly baked collection!</p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <Link
              href={storeSlug ? `/store/${storeSlug}/menu` : "/store/kuchaman-city/menu"}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full font-semibold hover:bg-primary-hover transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse Menu
            </Link>
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-primary text-primary px-5 py-3 rounded-full font-semibold hover:bg-primary/5 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={storeSlug ? `/store/${storeSlug}/menu` : "/"}
              className="p-1 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground font-serif">Your Cart</h1>
              <p className="text-xs text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
            </div>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-destructive hover:underline"
          >
            Clear All
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 pb-32">
        <div className="md:flex md:gap-6">
        {/* LEFT COLUMN — Items */}
        <div className="md:flex-1">
        {/* Items */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <h2 className="label-premium text-foreground">Items Added</h2>
          </div>
          <div className="divide-y divide-border">
            {items.map((item, idx) => (
              <div key={`${item.productId}-${item.variantName || ""}-${idx}`} className="px-4 py-3 flex items-center gap-3">
                {/* Item Image — clickable */}
                <Link href={`/store/${storeSlug || 'kuchaman-city'}/menu/${item.productId}`} className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-light flex items-center justify-center text-xl">🎂</div>
                  )}
                </Link>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
                  {item.variantName && (
                    <p className="text-xs text-muted-foreground">{item.variantName}</p>
                  )}
                  {item.flavour && (
                    <p className="text-xs text-muted-foreground">Flavour: {item.flavour}</p>
                  )}
                  {item.addOns && item.addOns.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      + {item.addOns.map((a) => a.name).join(", ")}
                    </p>
                  )}
                  {item.cakeMessage && (
                    <p className="text-xs text-primary font-medium mt-0.5">
                      Cake message: &ldquo;{item.cakeMessage}&rdquo;
                    </p>
                  )}
                  {(item.occasion || item.recipientName) && (
                    <p className="text-[10px] text-muted-foreground">
                      {item.occasion && <span className="capitalize">{item.occasion}</span>}
                      {item.recipientName && <span> for {item.recipientName}</span>}
                      {item.recipientAge && <span> ({item.recipientAge} yrs)</span>}
                    </p>
                  )}
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {formatPrice(
                      (item.unitPrice + (item.addOns || []).reduce((s, a) => s + a.price, 0)) * item.quantity
                    )}
                  </p>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantName)}
                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    {item.quantity === 1 ? (
                      <Trash2 className="w-3 h-3 text-destructive" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                  </button>
                  <span className="text-sm font-bold min-w-[24px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantName)}
                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add More + Special Instructions */}
        <div className="flex gap-3 mb-4">
          <Link
            href={storeSlug ? `/store/${storeSlug}/menu` : "/"}
            className="flex-1 text-center py-2.5 rounded-xl border border-border text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            + Add More Items
          </Link>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Notes
          </button>
        </div>

        {showInstructions && (
          <div className="bg-white rounded-2xl border border-border p-4 mb-4">
            <label className="text-sm font-semibold text-foreground block mb-2">
              Special Instructions for Kitchen
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="E.g., Less sugar, no nuts, extra chocolate..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        )}
        </div>{/* end left column */}

        {/* RIGHT COLUMN — Bill Summary (sticky on desktop) */}
        <div className="md:w-80 md:flex-shrink-0">
        {/* Bill Summary */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <h2 className="label-premium text-foreground">Bill Summary</h2>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Item Total</span>
              <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Packaging</span>
              <span className="font-medium text-foreground">{formatPrice(storeConfig.packagingCharge)}</span>
            </div>
            {storeConfig.gstRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST ({storeConfig.gstRate}%)</span>
              <span className="font-medium text-foreground">{formatPrice((subtotal + storeConfig.packagingCharge) * storeConfig.gstRate / 100)}</span>
            </div>
            )}
            <div className="border-t border-border pt-2 mt-2 flex justify-between">
              <span className="font-bold text-foreground">Grand Total</span>
              <span className="font-bold text-lg text-foreground">
                {formatPrice(subtotal + storeConfig.packagingCharge + (subtotal + storeConfig.packagingCharge) * storeConfig.gstRate / 100)}
              </span>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <p className="text-xs text-muted-foreground text-center mb-4">
          ⚠️ Orders once placed cannot be cancelled and are non-refundable
        </p>
        </div>{/* end right column */}
        </div>{/* end md:flex */}
      </main>

      {/* Sticky Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Link
            href="/checkout"
            className="flex items-center justify-between bg-primary text-primary-foreground rounded-xl px-5 py-3.5 hover:bg-primary-hover transition-colors w-full btn-press"
          >
            <span className="font-bold text-lg">
              {formatPrice(subtotal + storeConfig.packagingCharge + (subtotal + storeConfig.packagingCharge) * storeConfig.gstRate / 100)}
            </span>
            <span className="flex items-center gap-1 font-semibold">
              Proceed to Checkout →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
