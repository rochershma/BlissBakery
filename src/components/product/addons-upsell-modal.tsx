"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingCart, ChevronRight, Check, Plus } from "lucide-react";
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
  storeSlug: string;
  onClose: () => void;
}

export function AddOnsUpsellModal({ storeAddOns, productName, storeSlug, onClose }: Props) {
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const { items, addItem, getItemCount } = useCartStore();

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

  const handleAddAndContinue = () => {
    // Add selected add-ons to the most recently added cart item
    const lastItem = items[items.length - 1];
    if (lastItem && selectedAddOns.size > 0) {
      const addOns = storeAddOns
        .filter((a) => selectedAddOns.has(a.id))
        .map((a) => ({ name: a.name, price: a.price }));

      const existingAddOns = lastItem.addOns || [];
      const { updateItemAddOns } = useCartStore.getState();
      if (updateItemAddOns) {
        updateItemAddOns(lastItem.productId, [...existingAddOns, ...addOns], lastItem.variantName);
      }
    }
    onClose();
  };

  // Group by category
  const gifts = storeAddOns.filter((a) => a.category === "GIFT");
  const decorations = storeAddOns.filter((a) => a.category === "DECORATION");
  const accessories = storeAddOns.filter((a) => a.category === "ACCESSORY");
  const allGroups = [
    { label: "🎁 Gift Items", items: gifts },
    { label: "🎉 Decorations", items: decorations },
    { label: "✨ Extras", items: accessories },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Added to cart!</p>
                <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{productName}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Subtitle */}
        <div className="px-5 py-3 bg-primary/5 border-b border-border">
          <p className="text-sm font-semibold text-foreground">🎁 Make it extra special!</p>
          <p className="text-[11px] text-muted-foreground">Add gifts & accessories to your order</p>
        </div>

        {/* Add-ons Grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {allGroups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.label}</p>
              <div className="grid grid-cols-2 gap-2.5">
                {group.items.map((addon) => {
                  const isSelected = selectedAddOns.has(addon.id);
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggle(addon.id)}
                      className={`relative rounded-xl border-2 overflow-hidden text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/30 bg-white"
                      }`}
                    >
                      {/* Image */}
                      <div className="aspect-square relative bg-muted">
                        {addon.image ? (
                          <Image src={addon.image} alt={addon.name} fill className="object-cover" sizes="200px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-primary/10 to-accent/10">
                            {addon.category === "GIFT" ? "🎁" : addon.category === "DECORATION" ? "🎉" : "✨"}
                          </div>
                        )}
                        {/* Selection indicator */}
                        {isSelected ? (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm border border-border flex items-center justify-center">
                            <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-2">
                        <p className="text-[11px] font-semibold text-foreground line-clamp-1">{addon.name}</p>
                        <p className="text-xs font-bold text-primary">+{formatPrice(addon.price)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border px-5 py-4 space-y-2.5 bg-white">
          {selectedAddOns.size > 0 && (
            <div className="flex items-center justify-between text-sm mb-1">
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
                onClick={handleAddAndContinue}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors btn-press"
              >
                Add +{formatPrice(addOnTotal)} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-primary/10 transition-colors"
              >
                Continue Shopping <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
