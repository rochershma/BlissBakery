"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore, CartItem } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, MessageSquare, Home, ChevronRight, X, Leaf, Clock, Gift, Tag, Check, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/shared/site-header";

interface StoreAddOn {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
}

function CartItemCard({ item, storeSlug, addOnImages, onRemoveAddOn, storeAddOns, onAddAddOn }: { item: CartItem & { index: number }; storeSlug: string; addOnImages: Record<string, string>; onRemoveAddOn: (productId: string, addonIndex: number, variantName?: string) => void; storeAddOns: StoreAddOn[]; onAddAddOn: (productId: string, addon: { name: string; price: number }, variantName?: string) => void }) {
  const { updateQuantity } = useCartStore();
  const addOnTotal = (item.addOns || []).reduce((s, a) => s + a.price, 0);
  const productPrice = item.unitPrice * item.quantity;
  const lineTotal = (item.unitPrice + addOnTotal) * item.quantity;
  const productUrl = item.productSlug ? `/store/${storeSlug}/menu/${item.productSlug}` : `/store/${storeSlug}/menu`;

  return (
    <div className="p-4">
      {/* Main product row */}
      <div className="flex gap-3">
        {/* Product Image */}
        <Link href={productUrl} className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-surface-blush flex-shrink-0 relative">
          {item.image ? (
            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
          )}
          <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-sm border border-green-600 flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
          </span>
        </Link>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={productUrl} className="text-sm font-bold text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
                {item.name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                {item.variantName && (
                  <span className="text-[11px] text-muted-foreground">{item.variantName}</span>
                )}
                {item.flavour && (
                  <span className="text-[11px] text-muted-foreground">· {item.flavour}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => updateQuantity(item.productId, 0, item.variantName)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Cake message */}
          {item.cakeMessage && (
            <div className="mt-1.5 bg-primary/5 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
              <MessageSquare className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-primary font-medium leading-snug">&ldquo;{item.cakeMessage}&rdquo;</p>
            </div>
          )}

          {(item.occasion || item.recipientAge) && (
            <div className="flex items-center gap-1.5 mt-1">
              {item.occasion && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground capitalize">{item.occasion}</span>}
              {item.recipientAge && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Age: {item.recipientAge}</span>}
            </div>
          )}

          {/* Product price + Quantity — separated from add-on pricing */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-bold text-foreground">{formatPrice(productPrice)}</span>
            <div className="flex items-center gap-0.5 bg-primary/10 rounded-full">
              <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantName)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
                {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-destructive" /> : <Minus className="w-3.5 h-3.5 text-primary" />}
              </button>
              <span className="text-sm font-bold min-w-[28px] text-center text-primary">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantName)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Plus className="w-3.5 h-3.5 text-primary" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add-ons — clean chip style */}
      {item.addOns && item.addOns.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
            <Gift className="w-3 h-3 text-primary" /> Extras
          </p>
          <div className="flex flex-wrap gap-1.5">
            {item.addOns.map((addon, addonIdx) => (
              <div key={addonIdx} className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-surface-blush border border-border/50 rounded-lg text-xs">
                <span className="font-medium text-foreground">{addon.name}</span>
                <span className="text-muted-foreground">+{formatPrice(addon.price)}</span>
                <button
                  onClick={() => onRemoveAddOn(item.productId, addonIdx, item.variantName)}
                  className="ml-0.5 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                  aria-label={`Remove ${addon.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Line total if add-ons present */}
      {item.addOns && item.addOns.length > 0 && (
        <div className="mt-2 flex items-center justify-end gap-2 text-xs">
          <span className="text-muted-foreground">Item total:</span>
          <span className="font-bold text-foreground">{formatPrice(lineTotal)}</span>
        </div>
      )}

      {/* Add Extras — horizontal scroll strip */}
      {storeAddOns.length > 0 && (
        <AddExtrasStrip
          storeAddOns={storeAddOns}
          existingAddOns={item.addOns || []}
          onAdd={(addon) => onAddAddOn(item.productId, addon, item.variantName)}
        />
      )}
    </div>
  );
}

function AddExtrasStrip({ storeAddOns, existingAddOns, onAdd }: {
  storeAddOns: StoreAddOn[];
  existingAddOns: { name: string; price: number }[];
  onAdd: (addon: { name: string; price: number }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const existingNames = new Set(existingAddOns.map(a => a.name));

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-primary/25 text-primary text-xs font-semibold hover:bg-primary/5 hover:border-primary/40 transition-all"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Add Extras — Gifts, Candles & More
      </button>
    );
  }

  // Group by category
  const groups = [
    { key: "GIFT", label: "Gifts", items: storeAddOns.filter(a => a.category === "GIFT") },
    { key: "DECORATION", label: "Decorations", items: storeAddOns.filter(a => a.category === "DECORATION") },
    { key: "ACCESSORY", label: "Extras", items: storeAddOns.filter(a => a.category === "ACCESSORY") },
  ].filter(g => g.items.length > 0);

  // Fallback: if no categories match, show all
  const allItems = groups.length > 0 ? groups : [{ key: "ALL", label: "Add-ons", items: storeAddOns }];

  return (
    <div className="mt-3 bg-gradient-to-b from-primary/[0.03] to-transparent rounded-xl border border-primary/15 overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between">
        <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Make it special
        </p>
        <button onClick={() => setExpanded(false)} className="text-[10px] text-muted-foreground hover:text-foreground font-medium">
          Close
        </button>
      </div>
      <div className="px-3 pb-3 space-y-3">
        {allItems.map(group => (
          <div key={group.key}>
            {allItems.length > 1 && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.label}</p>
            )}
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {group.items.map(addon => {
                const alreadyAdded = existingNames.has(addon.name);
                return (
                  <button
                    key={addon.id}
                    onClick={() => {
                      if (!alreadyAdded) onAdd({ name: addon.name, price: addon.price });
                    }}
                    disabled={alreadyAdded}
                    className={`flex-shrink-0 w-[110px] rounded-xl border overflow-hidden text-left transition-all ${
                      alreadyAdded
                        ? "border-primary/30 bg-primary/5 opacity-70"
                        : "border-border bg-white hover:border-primary/40 hover:shadow-sm active:scale-[0.97]"
                    }`}
                  >
                    <div className="aspect-[4/3] relative bg-muted overflow-hidden">
                      {addon.image ? (
                        <Image src={addon.image} alt={addon.name} fill className="object-cover" sizes="110px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10">
                          <Gift className="w-6 h-6 text-primary/30" />
                        </div>
                      )}
                      {alreadyAdded && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] font-medium text-foreground line-clamp-1 leading-tight">{addon.name}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[10px] font-bold text-primary">+{formatPrice(addon.price)}</p>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                          alreadyAdded ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {alreadyAdded ? "Added" : "Add"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CartPage() {
  const [hydrated, setHydrated] = useState(false);
  const [storeConfig, setStoreConfig] = useState({ packagingCharge: 15, gstRate: 0 });
  const [addOnImages, setAddOnImages] = useState<Record<string, string>>({});
  const [storeAddOns, setStoreAddOns] = useState<StoreAddOn[]>([]);
  useEffect(() => {
    setHydrated(true);
    fetch("/api/store/config").then(r => r.json()).then(data => {
      if (data.packagingCharge !== undefined) setStoreConfig({ packagingCharge: data.packagingCharge ?? 15, gstRate: data.gstRate ?? 0 });
      if (data.addOnImages) setAddOnImages(data.addOnImages);
      if (data.addOns) setStoreAddOns(data.addOns);
    }).catch(() => {});
  }, []);

  const {
    items,
    storeSlug,
    specialInstructions,
    setSpecialInstructions,
    updateQuantity,
    removeItem,
    updateItemAddOns,
    getItemCount,
    getSubtotal,
    clearCart,
  } = useCartStore();

  const [showInstructions, setShowInstructions] = useState(false);
  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const gstAmount = storeConfig.gstRate > 0 ? (subtotal + storeConfig.packagingCharge) * storeConfig.gstRate / 100 : 0;
  const grandTotal = subtotal + storeConfig.packagingCharge + gstAmount;

  const removeAddOn = (productId: string, addonIndex: number, variantName?: string) => {
    const item = items.find(i => i.productId === productId && (i.variantName || "") === (variantName || ""));
    if (!item || !item.addOns) return;
    const newAddOns = item.addOns.filter((_, idx) => idx !== addonIndex);
    updateItemAddOns(productId, newAddOns, variantName);
  };

  const addAddOn = (productId: string, addon: { name: string; price: number }, variantName?: string) => {
    const item = items.find(i => i.productId === productId && (i.variantName || "") === (variantName || ""));
    if (!item) return;
    const existingAddOns = item.addOns || [];
    updateItemAddOns(productId, [...existingAddOns, addon], variantName);
  };

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const slug = storeSlug || "kuchaman-city";

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
          <div className="w-28 h-28 mb-5 rounded-full bg-primary/5 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-primary/30" />
          </div>
          <h2 className="text-xl font-bold text-foreground font-serif mb-2">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-xs">Looks like you haven&apos;t added any treats yet. Explore our freshly baked collection!</p>
          <Link
            href={`/store/${slug}/menu`}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-[1300px] mx-auto px-4 md:px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/store/${slug}/menu`} className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground font-serif">Your Cart</h1>
              <p className="text-[11px] text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "items"} · {formatPrice(subtotal)}</p>
            </div>
          </div>
          <button onClick={clearCart} className="text-xs text-destructive hover:underline font-medium">
            Clear All
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1300px] mx-auto w-full px-4 md:px-5 py-4 pb-28">
        <div className="md:flex md:gap-5">
          {/* LEFT — Cart Items */}
          <div className="md:flex-1 space-y-3">
            {/* Delivery promise banner */}
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-green-800">Same-Day Delivery Available</p>
                <p className="text-[10px] text-green-600">Order 2 hours before your desired slot · Free pickup from store</p>
              </div>
            </div>

            {/* Items card */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {items.map((item, idx) => (
                  <CartItemCard
                    key={`${item.productId}-${item.variantName || ""}-${idx}`}
                    item={{ ...item, index: idx }}
                    storeSlug={slug}
                    addOnImages={addOnImages}
                    onRemoveAddOn={removeAddOn}
                    storeAddOns={storeAddOns}
                    onAddAddOn={addAddOn}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <Link
                href={`/store/${slug}/menu`}
                className="flex-1 text-center py-3 rounded-xl border-2 border-dashed border-primary/30 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
              >
                + Add More Items
              </Link>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className={`flex items-center gap-1.5 py-3 px-5 rounded-xl border text-sm font-medium transition-colors ${
                  showInstructions || specialInstructions ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Notes
              </button>
            </div>

            {showInstructions && (
              <div className="bg-white rounded-xl border border-border p-4">
                <label className="text-xs font-semibold text-foreground block mb-2">
                  Special Instructions for Kitchen
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="E.g., Less sugar, no nuts, extra chocolate..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            )}
          </div>

          {/* RIGHT — Summary (sticky on desktop) */}
          <div className="md:w-[340px] md:flex-shrink-0 mt-3 md:mt-0">
            <div className="md:sticky md:top-[72px] space-y-3">
              {/* Bill Summary */}
              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="text-sm font-bold text-foreground">Bill Details</h2>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Item Total</span>
                    <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Packaging</span>
                    <span className="font-semibold text-foreground">{formatPrice(storeConfig.packagingCharge)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  {storeConfig.gstRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST ({storeConfig.gstRate}%)</span>
                      <span className="font-semibold text-foreground">{formatPrice(gstAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2.5 flex justify-between">
                    <span className="text-base font-bold text-foreground">To Pay</span>
                    <span className="text-base font-bold text-foreground">{formatPrice(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Trust signals */}
              <div className="bg-white rounded-2xl border border-border p-4">
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Leaf className="w-3 h-3 text-green-600" /> 100% Eggless</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary" /> Fresh Daily</span>
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3 text-primary" /> Best Price</span>
                </div>
              </div>

              {/* Cancellation note */}
              <p className="text-[10px] text-muted-foreground text-center px-4">
                By proceeding, you agree to our terms. Because each cake is freshly prepared, confirmed orders cannot be cancelled.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Checkout Bar */}
      <div className="sticky-checkout-bar">
        <div>
          <p className="text-[11px] text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
          <p className="text-lg font-bold text-foreground">{formatPrice(grandTotal)}</p>
        </div>
        <Link
          href="/checkout"
          className="sticky-cta-btn"
        >
          Checkout <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
