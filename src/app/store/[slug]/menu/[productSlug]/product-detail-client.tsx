"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, ShoppingCart, Check, Gift, MessageSquare, Clock } from "lucide-react";
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
    pricingStrategy?: "FIXED" | "CUSTOM";
    flavourPrices?: { name: string; price500g: number }[];
    designCharge?: number;
    base500gPrice?: number;
    defaultFlavour?: string;
    variants: { id: string; name: string; price: number; serves?: string; weightKg?: number }[];
    addOns: { id: string; name: string; price: number }[];
  };
  storeAddOns?: { id: string; name: string; price: number; category: string; image?: string | null }[];
}

function FlavourSelect({ flavours, selected, onSelect }: { flavours: string[]; selected: string; onSelect: (f: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground block mb-1.5">Flavour</label>
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors appearance-none cursor-pointer"
        >
          {flavours.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function OccasionSelect({ occasions, selected, onSelect }: { occasions: { key: string; label: string }[]; selected: string; onSelect: (k: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground block mb-1.5">Occasion</label>
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors appearance-none cursor-pointer"
        >
          {occasions.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function ProductDetailClient({ storeSlug, product, storeAddOns = [] }: Props) {
  const { addItem, setStoreSlug, getItemCount, getSubtotal } = useCartStore();

  const [hydrated, setHydrated] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.length > 0 ? product.variants[0] : null
  );
  const isCustomPricing = product.pricingStrategy === "CUSTOM";
  const flavourPriceMap = new Map((product.flavourPrices || []).map(fp => [fp.name, fp.price500g]));

  // Default flavour: admin-set default, or cheapest for custom, or first in list
  const getDefaultFlavour = (): string => {
    const flavours = product.flavours || [];
    if (flavours.length === 0) return "";
    // Admin set a specific default
    if (product.defaultFlavour && flavours.includes(product.defaultFlavour)) return product.defaultFlavour;
    // Custom pricing: default to cheapest
    if (isCustomPricing && flavourPriceMap.size > 0) {
      return [...flavours].sort((a, b) => (flavourPriceMap.get(a) || 999999) - (flavourPriceMap.get(b) || 999999))[0];
    }
    return flavours[0];
  };

  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [selectedStoreAddOns, setSelectedStoreAddOns] = useState<Set<string>>(new Set());
  const [selectedFlavour, setSelectedFlavour] = useState<string>(getDefaultFlavour());
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  // Cake customization
  const [occasion, setOccasion] = useState("birthday");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAge, setRecipientAge] = useState("");
  const [cakeMessage, setCakeMessage] = useState("");

  useEffect(() => setHydrated(true), []);

  // Show cake-specific fields (occasion, message, age) for cake categories
  const cakePrefixes = ["cakes", "designer-cakes", "occasion-cakes", "custom-cakes"];
  const catSlug = product.categorySlug || "";
  const isCake = cakePrefixes.some(prefix => catSlug === prefix || catSlug.startsWith(prefix + "-"));
  const hasFlavours = product.flavours && product.flavours.length > 0;

  // Custom pricing calculation
  const getCustomPrice = (flavour: string, weightKg: number): number => {
    const flavour500g = flavourPriceMap.get(flavour) || (product.base500gPrice ?? 300);
    const designCharge = product.designCharge || 0;
    return Math.round(flavour500g * weightKg * 2 + designCharge);
  };

  // Parse weight from variant name (e.g., "0.5 Kg" → 0.5, "1 Kg" → 1)
  const getVariantWeight = (variant: { name: string; weightKg?: number }): number => {
    if (variant.weightKg) return variant.weightKg;
    const match = variant.name.match(/([\d.]+)\s*[Kk][Gg]/);
    return match ? parseFloat(match[1]) : 0.5;
  };

  const currentWeight = selectedVariant ? getVariantWeight(selectedVariant) : 0.5;
  const unitPrice = isCustomPricing && selectedFlavour
    ? getCustomPrice(selectedFlavour, currentWeight)
    : (selectedVariant ? selectedVariant.price : product.basePrice);
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
          <p className="text-xs font-semibold text-foreground mb-2">Select Size</p>
          {(() => {
            const mainVariants = product.variants.filter((_, i) => i < 6);
            const overflowVariants = product.variants.filter((_, i) => i >= 6);
            return (
              <>
                <div className="flex flex-wrap gap-2">
                  {mainVariants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        selectedVariant?.id === v.id
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white text-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
                {overflowVariants.length > 0 && (
                  <select
                    value={selectedVariant && overflowVariants.some(v => v.id === selectedVariant.id) ? selectedVariant.id : ""}
                    onChange={(e) => {
                      const v = overflowVariants.find(v => v.id === e.target.value);
                      if (v) setSelectedVariant(v);
                    }}
                    className="mt-2 max-w-[200px] px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  >
                    <option value="">More sizes...</option>
                    {overflowVariants.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                )}
                {selectedVariant?.serves && (
                  <p className="text-[11px] text-muted-foreground mt-2">🍽️ Serves {selectedVariant.serves}</p>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Flavour & Occasion */}
      {(hasFlavours || isCake) && (
        <div className={hasFlavours && isCake ? "grid grid-cols-2 gap-3" : ""}>
          {hasFlavours && (
            <FlavourSelect
              flavours={product.flavours!}
              selected={selectedFlavour}
              onSelect={setSelectedFlavour}
            />
          )}
          {isCake && (
            <OccasionSelect
              occasions={OCCASIONS}
              selected={occasion}
              onSelect={setOccasion}
            />
          )}
        </div>
      )}

      {isCake && (
      <>

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

      {/* Delivery Promise */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 font-medium border border-green-100">
          <Clock className="w-3 h-3" /> Ready today
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-blush text-foreground font-medium border border-border/50">
          <Gift className="w-3 h-3 text-primary" /> Pickup free
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-blush text-foreground font-medium border border-border/50">
          <Check className="w-3 h-3 text-primary" /> 100% Eggless
        </span>
      </div>

      {/* Add to Cart — desktop only (mobile uses sticky bar) */}
      <div className="hidden md:block">
        <button
          onClick={handleAddToCart}
          disabled={added}
          className="w-full max-w-[320px] flex items-center justify-center gap-2.5 bg-primary text-primary-foreground py-3 px-6 rounded-2xl text-sm font-bold hover:bg-primary-hover active:scale-[0.97] transition-all shadow-md shadow-primary/20 disabled:opacity-70"
        >
          <ShoppingCart className="w-4 h-4" />
          {added ? "Added!" : `Add to Cart · ${formatPrice(totalPrice)}`}
        </button>
        <p className="text-[10px] text-muted-foreground mt-2.5 leading-relaxed max-w-[320px]">
          Note: Design and icing may vary slightly from the image, as each cake is handcrafted.
        </p>
      </div>

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

      {/* Mobile Sticky Add to Cart Bar */}
      {!showUpsell && (
        <div className="sticky-cta-bar">
          <span className="sticky-cta-price">{formatPrice(totalPrice)}</span>
          <button onClick={handleAddToCart} disabled={added} className="sticky-cta-btn disabled:opacity-70">
            <ShoppingCart className="w-4 h-4" />
            {added ? "Added!" : "Add to Cart"}
          </button>
        </div>
      )}
    </div>
  );
}
