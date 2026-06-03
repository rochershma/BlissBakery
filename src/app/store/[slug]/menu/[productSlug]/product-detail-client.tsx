"use client";

import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, ShoppingCart, Check, Gift, MessageSquare, ChevronDown } from "lucide-react";
import Link from "next/link";
import { AddOnsUpsellModal } from "@/components/product/addons-upsell-modal";

const OCCASIONS = [
  { key: "birthday", label: "Birthday" },
  { key: "anniversary", label: "Anniversary" },
  { key: "wedding", label: "Wedding" },
  { key: "valentine", label: "Valentine" },
  { key: "celebration", label: "Celebration" },
  { key: "festival", label: "Festival" },
  { key: "baby-shower", label: "Baby Shower" },
  { key: "retirement", label: "Retirement" },
  { key: "farewell", label: "Farewell" },
  { key: "congratulations", label: "Congratulations" },
  { key: "gift", label: "Just a Gift" },
];

interface Props {
  storeSlug: string;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    mrpPrice?: number | null;
    image?: string;
    categorySlug?: string;
    servingInfo?: string;
    flavours?: string[];
    variants: { id: string; name: string; price: number; serves?: string }[];
    addOns: { id: string; name: string; price: number }[];
  };
  storeAddOns?: { id: string; name: string; price: number; category: string; image?: string | null }[];
}

function FlavourDropdown({ flavours, selected, onSelect }: { flavours: string[]; selected: string; onSelect: (f: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative max-w-[220px]">
      <p className="text-sm font-semibold text-foreground mb-2.5">Choose Flavour</p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-border bg-white text-sm font-medium text-foreground hover:border-primary/50 transition-colors"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected || "Select flavour"}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden" style={{ animation: 'fadeIn 0.1s ease-out' }}>
          <div className="max-h-48 overflow-y-auto py-1">
            {flavours.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => { onSelect(f); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  selected === f
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                {f}
                {selected === f && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductDetailClient({ storeSlug, product, storeAddOns = [] }: Props) {
  const { addItem, setStoreSlug, getItemCount, getSubtotal } = useCartStore();

  const [hydrated, setHydrated] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.length > 0 ? product.variants[0] : null
  );
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [selectedStoreAddOns, setSelectedStoreAddOns] = useState<Set<string>>(new Set());
  const [selectedFlavour, setSelectedFlavour] = useState<string>(
    (product.flavours && product.flavours.length > 0) ? product.flavours[0] : ""
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  // Cake customization
  const [occasion, setOccasion] = useState("birthday");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAge, setRecipientAge] = useState("");
  const [cakeMessage, setCakeMessage] = useState("");

  useEffect(() => setHydrated(true), []);

  // Only show cake-specific fields for cake categories
  const cakeSlugs = ["cakes", "designer-cakes", "occasion-cakes"];
  const isCake = cakeSlugs.includes(product.categorySlug || "");

  const unitPrice = selectedVariant ? selectedVariant.price : product.basePrice;
  const productAddOnTotal = product.addOns.filter(a => selectedAddOns.has(a.id)).reduce((s, a) => s + a.price, 0);
  const storeAddOnTotal = storeAddOns.filter(a => selectedStoreAddOns.has(a.id)).reduce((s, a) => s + a.price, 0);
  const totalPrice = (unitPrice + productAddOnTotal) * quantity + storeAddOnTotal;

  const itemCount = hydrated ? getItemCount() : 0;
  const cartSubtotal = hydrated ? getSubtotal() : 0;

  const handleAddToCart = () => {
    setStoreSlug(storeSlug);
    const allAddOns = [
      ...product.addOns.filter(a => selectedAddOns.has(a.id)).map(a => ({ name: a.name, price: a.price })),
      ...storeAddOns.filter(a => selectedStoreAddOns.has(a.id)).map(a => ({ name: a.name, price: a.price })),
    ];
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        productSlug: product.slug,
        name: product.name,
        image: product.image,
        variantName: selectedVariant?.name,
        unitPrice,
        addOns: allAddOns.length > 0 ? allAddOns : undefined,
        flavour: selectedFlavour || undefined,
        cakeMessage: cakeMessage.trim() || undefined,
        occasion: occasion || undefined,
        recipientName: recipientName.trim() || undefined,
        recipientAge: recipientAge.trim() || undefined,
      });
    }
    setAdded(true);
    // Always show upsell/confirmation modal (premium flow)
    setShowUpsell(true);
  };

  const toggleAddOn = (id: string) => setSelectedAddOns(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleStoreAddOn = (id: string) => setSelectedStoreAddOns(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="space-y-5">
      {/* Dynamic Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl md:text-3xl font-bold text-foreground">{formatPrice(unitPrice)}</span>
        {product.mrpPrice && product.mrpPrice > unitPrice && (
          <>
            <span className="text-base text-muted-foreground line-through">{formatPrice(product.mrpPrice)}</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
              {Math.round((product.mrpPrice - unitPrice) / product.mrpPrice * 100)}% OFF
            </span>
          </>
        )}
      </div>

      {/* Weight / Size Variants */}
      {product.variants.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-2.5">Select Size</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                  selectedVariant?.id === v.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-white text-foreground border-border hover:border-primary/50"
                }`}
              >
                {v.name} · {formatPrice(v.price)}
              </button>
            ))}
          </div>
          {(selectedVariant?.serves || product.servingInfo) && (
            <p className="text-xs text-muted-foreground mt-2">
              🍽️ {selectedVariant?.serves || product.servingInfo}
            </p>
          )}
        </div>
      )}

      {/* Flavour Selector — themed custom dropdown */}
      {product.flavours && product.flavours.length > 0 && (
        <FlavourDropdown
          flavours={product.flavours}
          selected={selectedFlavour}
          onSelect={setSelectedFlavour}
        />
      )}

      {/* Occasion, Message — cakes only */}
      {isCake && (
      <>
      <div>
        <p className="text-sm font-semibold text-foreground mb-2.5">Occasion</p>
        <div className="relative max-w-[250px]">
          <select
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-white text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer"
          >
            {OCCASIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Age on Cake (if birthday) */}
      {occasion === "birthday" && (
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Age on Cake</p>
        <input
          value={recipientAge}
          onChange={(e) => setRecipientAge(e.target.value.replace(/\D/g, ""))}
          placeholder="e.g., 25"
          maxLength={3}
          className="w-24 px-4 py-2.5 rounded-xl border-2 border-border text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground transition-colors"
        />
      </div>
      )}

      {/* Cake Message */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-primary" /> Message on Cake
        </p>
        <div className="relative">
          <input
            value={cakeMessage}
            onChange={(e) => setCakeMessage(e.target.value)}
            placeholder="e.g., Happy Birthday Raj! 🎂"
            maxLength={50}
            className="w-full px-4 py-3 rounded-xl border-2 border-border text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{cakeMessage.length}/50</span>
        </div>
      </div>
      </>
      )}

      {/* Product Add-ons */}
      {product.addOns.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-2.5">Customize</p>
          <div className="space-y-2">
            {product.addOns.map((addon) => (
              <label
                key={addon.id}
                className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${
                  selectedAddOns.has(addon.id) ? "bg-primary/5 border-primary" : "bg-white border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input type="checkbox" checked={selectedAddOns.has(addon.id)} onChange={() => toggleAddOn(addon.id)} className="w-4 h-4 accent-primary" />
                  <span className="font-medium">{addon.name}</span>
                </div>
                <span className="font-semibold text-muted-foreground">+{formatPrice(addon.price)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Quantity + Add to Cart */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-border rounded-full">
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-l-full transition-colors">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-bold min-w-[28px] text-center">{quantity}</span>
          <button onClick={() => setQuantity(q => q + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-r-full transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button onClick={handleAddToCart} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary-hover transition-colors btn-press">
          <ShoppingCart className="w-4 h-4" /> Add to Cart · {formatPrice(totalPrice)}
        </button>
      </div>

      {/* Cart summary */}
      {hydrated && itemCount > 0 && !added && (
        <Link href="/cart" className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 text-sm hover:bg-primary/5 transition-colors">
          <span className="text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "items"} in cart</span>
          <span className="font-semibold text-primary">{formatPrice(cartSubtotal)} →</span>
        </Link>
      )}

      {/* Add-ons Upsell Modal (Bakingo-style) */}
      {showUpsell && (
        <AddOnsUpsellModal
          storeAddOns={storeAddOns.map(a => ({ id: a.id, name: a.name, price: a.price, image: a.image || null, category: a.category }))}
          productName={product.name}
          productImage={product.image}
          unitPrice={unitPrice}
          variantName={selectedVariant?.name}
          storeSlug={storeSlug}
          onClose={() => { setShowUpsell(false); setAdded(false); }}
        />
      )}
    </div>
  );
}
