"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, ShoppingCart, Check, Gift, MessageSquare } from "lucide-react";
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

function FlavourSelect({ flavours, selected, onSelect }: { flavours: string[]; selected: string; onSelect: (f: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground block mb-1.5">Flavour</label>
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-white text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors appearance-none cursor-pointer"
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
          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-white text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors appearance-none cursor-pointer"
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
                    className="mt-2 w-full px-3 py-2.5 rounded-xl border border-border bg-white text-xs font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
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
      {isCake && (
      <>
      <div className="grid grid-cols-2 gap-3">
        {/* Flavour */}
        {product.flavours && product.flavours.length > 0 && (
          <FlavourSelect
            flavours={product.flavours}
            selected={selectedFlavour}
            onSelect={setSelectedFlavour}
          />
        )}
        {/* Occasion */}
        <OccasionSelect
          occasions={OCCASIONS}
          selected={occasion}
          onSelect={setOccasion}
        />
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
