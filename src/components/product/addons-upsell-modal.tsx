"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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

    setTimeout(() => onClose(), 300);
  };

  // Group by category
  const groups = [
    { key: "GIFT", label: "Gifts", emoji: "🎁", items: storeAddOns.filter((a) => a.category === "GIFT") },
    { key: "DECORATION", label: "Decorations", emoji: "🎉", items: storeAddOns.filter((a) => a.category === "DECORATION") },
    { key: "ACCESSORY", label: "Extras", emoji: "✨", items: storeAddOns.filter((a) => a.category === "ACCESSORY") },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
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

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
              {groups.map((group) => (
                <div key={group.key}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    {group.emoji} {group.label}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
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
                          <div className="aspect-square relative bg-muted">
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
                          <div className="px-1.5 py-1.5">
                            <p className="text-[10px] font-medium text-foreground line-clamp-1 leading-tight">{addon.name}</p>
                            <p className="text-[10px] font-bold text-primary">+{formatPrice(addon.price)}</p>
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
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <ShoppingCart className="w-4 h-4" /> View Cart
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
                  <>Add {formatPrice(addOnTotal)} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
              >
                Continue Shopping <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
