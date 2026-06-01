"use client";

import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, ShoppingCart, Check, Gift, MessageSquare, ChevronDown } from "lucide-react";
import Link from "next/link";

const OCCASIONS = [
  { key: "birthday", label: "Birthday", emoji: "🎂" },
  { key: "anniversary", label: "Anniversary", emoji: "💕" },
  { key: "wedding", label: "Wedding", emoji: "💍" },
  { key: "valentine", label: "Valentine", emoji: "❤️" },
  { key: "celebration", label: "Celebration", emoji: "🎉" },
  { key: "festival", label: "Festival", emoji: "🪔" },
  { key: "gift", label: "Just a Gift", emoji: "🎁" },
];

interface Props {
  storeSlug: string;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    image?: string;
    categorySlug?: string;
    servingInfo?: string;
    flavours?: string[];
    variants: { id: string; name: string; price: number; serves?: string }[];
    addOns: { id: string; name: string; price: number }[];
  };
  storeAddOns?: { id: string; name: string; price: number; category: string }[];
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
    <div ref={ref} className="relative">
      <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Choose Flavour</h3>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-medium text-foreground hover:border-primary/50 transition-colors"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected || "Select a flavour..."}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
          <div className="max-h-52 overflow-y-auto py-1">
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

  // Cake customization
  const [occasion, setOccasion] = useState("");
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
    setTimeout(() => setAdded(false), 2500);
  };

  const toggleAddOn = (id: string) => setSelectedAddOns(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleStoreAddOn = (id: string) => setSelectedStoreAddOns(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="mt-4 space-y-4">
      {/* Weight / Size Variants */}
      {product.variants.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Select Weight</h3>
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
          {(selectedVariant?.serves || product.servingInfo) && (
            <p className="text-xs text-muted-foreground mt-2">
              Serving size: <span className="font-medium text-foreground">{selectedVariant?.serves || product.servingInfo}</span>
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

      {/* Occasion, Recipient, Message — cakes only */}
      {isCake && (
      <>
      <div>
        <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">For What Occasion?</h3>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setOccasion(occasion === o.key ? "" : o.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                occasion === o.key
                  ? "bg-primary/10 text-primary border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              {o.emoji} {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipient Name + Age (if birthday) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <h3 className="text-xs font-semibold text-foreground mb-1.5">Recipient&apos;s Name</h3>
          <input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="e.g., Raj"
            maxLength={30}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>
        {occasion === "birthday" && (
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-1.5">Age</h3>
            <input
              value={recipientAge}
              onChange={(e) => setRecipientAge(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g., 25"
              maxLength={3}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
          </div>
        )}
      </div>

      {/* Cake Message */}
      <div>
        <h3 className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-primary" /> Message on Cake
        </h3>
        <input
          value={cakeMessage}
          onChange={(e) => setCakeMessage(e.target.value)}
          placeholder="e.g., Happy Birthday Raj!"
          maxLength={25}
          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
        />
        <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{cakeMessage.length}/25</p>
      </div>
      </>
      )}

      {/* Product Add-ons */}
      {product.addOns.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Customize</h3>
          <div className="space-y-1.5">
            {product.addOns.map((addon) => (
              <label
                key={addon.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                  selectedAddOns.has(addon.id) ? "bg-primary/5 border-primary" : "bg-white border-border hover:border-primary/30"
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

      {/* Store-Level Add-Ons (Gifts & Extras) — cakes only */}
      {isCake && storeAddOns.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider flex items-center gap-1">
            <Gift className="w-3 h-3 text-primary" /> Add Something Extra
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {storeAddOns.map((addon) => (
              <label
                key={addon.id}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs ${
                  selectedStoreAddOns.has(addon.id) ? "bg-primary/5 border-primary" : "bg-white border-border hover:border-primary/30"
                }`}
              >
                <input type="checkbox" checked={selectedStoreAddOns.has(addon.id)} onChange={() => toggleStoreAddOn(addon.id)} className="w-3 h-3 accent-primary flex-shrink-0" />
                <span className="flex-1 truncate">{addon.name}</span>
                <span className="text-muted-foreground font-medium flex-shrink-0">+{formatPrice(addon.price)}</span>
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

      {/* Cart summary */}
      {hydrated && itemCount > 0 && !added && (
        <Link href="/cart" className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 text-sm hover:bg-primary/5 transition-colors">
          <span className="text-muted-foreground">{itemCount} {itemCount === 1 ? "item" : "items"} in cart</span>
          <span className="font-semibold text-primary">{formatPrice(cartSubtotal)} →</span>
        </Link>
      )}
    </div>
  );
}
