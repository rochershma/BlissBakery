"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import Link from "next/link";

interface Props {
  storeSlug: string;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    image?: string;
    variants: { id: string; name: string; price: number }[];
    addOns: { id: string; name: string; price: number }[];
  };
}

export function ProductDetailClient({ storeSlug, product }: Props) {
  const router = useRouter();
  const { addItem, setStoreSlug, getItemCount, getSubtotal, updateQuantity, items } = useCartStore();

  const [hydrated, setHydrated] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.length > 0 ? product.variants[0] : null
  );
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => setHydrated(true), []);

  const unitPrice = selectedVariant ? selectedVariant.price : product.basePrice;
  const addOnTotal = product.addOns
    .filter((a) => selectedAddOns.has(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  const totalPrice = (unitPrice + addOnTotal) * quantity;

  const itemCount = hydrated ? getItemCount() : 0;
  const cartSubtotal = hydrated ? getSubtotal() : 0;

  const handleAddToCart = () => {
    setStoreSlug(storeSlug);
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        image: product.image,
        variantName: selectedVariant?.name,
        unitPrice,
        addOns: product.addOns
          .filter((a) => selectedAddOns.has(a.id))
          .map((a) => ({ name: a.name, price: a.price })),
      });
    }
    // Show success feedback
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mt-4">
      {/* Variants */}
      {product.variants.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Select Size</h3>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all btn-press ${
                  selectedVariant?.id === v.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-foreground border-border hover:border-primary/50"
                }`}
              >
                {v.name} · {formatPrice(v.price)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add-ons */}
      {product.addOns.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Add-ons</h3>
          <div className="space-y-1.5">
            {product.addOns.map((addon) => (
              <label
                key={addon.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                  selectedAddOns.has(addon.id)
                    ? "bg-primary/5 border-primary"
                    : "bg-white border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedAddOns.has(addon.id)} onChange={() => toggleAddOn(addon.id)} className="w-3.5 h-3.5 accent-primary" />
                  <span>{addon.name}</span>
                </div>
                <span className="font-medium text-muted-foreground">+{formatPrice(addon.price)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Quantity + Add to Cart — INLINE */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center border border-border rounded-full">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-l-full transition-colors">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-bold min-w-[28px] text-center">{quantity}</span>
          <button onClick={() => setQuantity((q) => q + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-r-full transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {added ? (
          <Link href="/cart" className="flex-1 flex items-center justify-center gap-2 bg-success text-white py-3 rounded-xl font-semibold animate-scale-pop transition-colors">
            <Check className="w-4 h-4" /> Added! View Cart →
          </Link>
        ) : (
          <button onClick={handleAddToCart} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary-hover transition-colors btn-press">
            <ShoppingCart className="w-4 h-4" /> Add to Cart · {formatPrice(totalPrice)}
          </button>
        )}
      </div>

      {/* Cart summary link */}
      {hydrated && itemCount > 0 && !added && (
        <Link href="/cart" className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 text-sm hover:bg-primary/5 transition-colors">
          <span className="text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "items"} in cart</span>
          <span className="font-semibold text-primary">{formatPrice(cartSubtotal)} →</span>
        </Link>
      )}
    </div>
  );
}
