"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ShoppingCart, ChevronRight, Check, Plus, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";

interface AddOnItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
}

interface Props {
  storeAddOns: AddOnItem[];
  productName: string;
  productImage?: string;
  unitPrice: number;
  variantName?: string;
  storeSlug: string;
  onClose: () => void;
}

export function AddOnsUpsellModal({ storeAddOns, productName, productImage, unitPrice, variantName, storeSlug, onClose }: Props) {
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [addingToCart, setAddingToCart] = useState(false);
  const router = useRouter();

  const toggle = (id: string) => {
    setSelectedAddOns((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const addOnTotal = storeAddOns
    .filter((a) => selectedAddOns.has(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const handleAddSelected = () => {
    if (selectedAddOns.size === 0) { onClose(); return; }
    setAddingToCart(true);

    // Find the most recent cart item matching this product
    const { items, updateItemAddOns } = useCartStore.getState();
    const lastItem = [...items].reverse().find((i) => i.name === productName);
    if (lastItem) {
      const newAddOns = storeAddOns
        .filter((a) => selectedAddOns.has(a.id))
        .map((a) => ({ name: a.name, price: a.price }));
      const existingAddOns = lastItem.addOns || [];
      updateItemAddOns(lastItem.productId, [...existingAddOns, ...newAddOns], lastItem.variantName);
    }

    setTimeout(() => { onClose(); router.push("/cart"); }, 300);
  };

  // Group by category
  const groups = [
    { key: "GIFT", label: "Gifts", emoji: "🎁", items: storeAddOns.filter((a) => a.category === "GIFT") },
    { key: "DECORATION", label: "Decorations", emoji: "🎉", items: storeAddOns.filter((a) => a.category === "DECORATION") },
    { key: "ACCESSORY", label: "Extras", emoji: "✨", items: storeAddOns.filter((a) => a.category === "ACCESSORY") },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose}>
      {/* Full-screen on mobile, centered modal on desktop */}
      <div
        className="absolute inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white md:w-full md:max-w-2xl md:max-h-[85vh] md:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up md:animate-fade-in flex flex-col"
        style={{ maxHeight: "calc(100vh - 20px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Success header with product info */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-5 py-4">
          <div className="flex items-center gap-3">
            {/* Product thumbnail */}
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative bg-muted border border-border">
              {productImage ? (
                <Image src={productImage} alt={productName} fill className="object-cover" sizes="56px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🎂</div>
              )}
              {/* Checkmark overlay */}
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-green-800 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Added to cart
              </p>
              <p className="text-xs text-green-700/70 truncate">{productName}</p>
              <p className="text-xs text-green-700/70">
                {variantName && <>{variantName} · </>}{formatPrice(unitPrice)}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-green-100 transition-colors flex-shrink-0">
              <X className="w-5 h-5 text-green-700/50" />
            </button>
          </div>
        </div>

        {/* Add-ons section */}
        {storeAddOns.length > 0 && (
          <>
            <div className="px-5 py-3 border-b border-border bg-white">
              <p className="text-sm font-bold text-foreground">Make it extra special ✨</p>
              <p className="text-[11px] text-muted-foreground">Add gifts & accessories to your order</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {groups.map((group) => (
                <div key={group.key}>
                  <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                    <span>{group.emoji}</span> {group.label}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {group.items.map((addon) => {
                      const isSelected = selectedAddOns.has(addon.id);
                      return (
                        <button
                          key={addon.id}
                          onClick={() => toggle(addon.id)}
                          className={`relative rounded-xl border-2 overflow-hidden text-left transition-all active:scale-95 ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                              : "border-border hover:border-primary/30 bg-white"
                          }`}
                        >
                          <div className="aspect-[4/3] relative bg-muted rounded-t-lg overflow-hidden">
                            {addon.image ? (
                              <Image src={addon.image} alt={addon.name} fill className="object-cover" sizes="150px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-primary/5 to-accent/10">
                                {addon.category === "GIFT" ? "🎁" : addon.category === "DECORATION" ? "🎉" : "✨"}
                              </div>
                            )}
                            {/* Selection indicator */}
                            <div className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                              isSelected ? "bg-primary shadow-sm" : "bg-white/80 backdrop-blur-sm border border-border/50"
                            }`}>
                              {isSelected ? (
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              ) : (
                                <Plus className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <div className="px-2 py-2">
                            <p className="text-[11px] font-medium text-foreground line-clamp-1 leading-tight">{addon.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[11px] font-bold text-primary">+{formatPrice(addon.price)}</p>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                                {isSelected ? "Added" : "Add"}
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
          </>
        )}

        {/* Footer CTAs */}
        <div className="border-t border-border px-5 py-4 bg-white safe-area-bottom">
          {selectedAddOns.size > 0 && (
            <div className="flex items-center justify-between text-xs mb-2.5 px-1">
              <span className="text-muted-foreground">{selectedAddOns.size} add-on{selectedAddOns.size > 1 ? "s" : ""} selected</span>
              <span className="font-bold text-foreground">+{formatPrice(addOnTotal)}</span>
            </div>
          )}

          <div className="flex gap-2.5">
            <Link
              href="/cart"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Skip
            </Link>

            {selectedAddOns.size > 0 ? (
              <button
                onClick={handleAddSelected}
                disabled={addingToCart}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors btn-press disabled:opacity-70"
              >
                {addingToCart ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Continue · +{formatPrice(addOnTotal)} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            ) : (
              <Link
                href="/cart"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
