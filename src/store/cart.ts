"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  productSlug?: string;
  name: string;
  image?: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  addOns?: { name: string; price: number }[];
  flavour?: string;
  // New: cake customization
  cakeMessage?: string;
  occasion?: string;
  recipientName?: string;
  recipientAge?: string;
}

interface CartState {
  items: CartItem[];
  storeSlug: string | null;
  orderType: "PICKUP" | "DELIVERY";
  specialInstructions: string;

  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string, variantName?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantName?: string) => void;
  updateItemAddOns: (productId: string, addOns: { name: string; price: number }[], variantName?: string) => void;
  updateItemPrice: (productId: string, price: number, variantName?: string, flavour?: string) => void;
  clearCart: () => void;
  setStoreSlug: (slug: string) => void;
  setOrderType: (type: "PICKUP" | "DELIVERY") => void;
  setSpecialInstructions: (instructions: string) => void;

  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      storeSlug: null,
      orderType: "PICKUP",
      specialInstructions: "",

      addItem: (item) => {
        const { items } = get();
        // Include customization in dedup key so different messages/flavours are separate items
        const key = `${item.productId}-${item.variantName || ""}-${item.flavour || ""}-${item.cakeMessage || ""}-${item.occasion || ""}-${item.recipientName || ""}`;
        const existing = items.find(
          (i) => `${i.productId}-${i.variantName || ""}-${i.flavour || ""}-${i.cakeMessage || ""}-${i.occasion || ""}-${i.recipientName || ""}` === key
        );

        if (existing) {
          if (existing.quantity >= 50) return;
          set({
            items: items.map((i) =>
              `${i.productId}-${i.variantName || ""}-${i.flavour || ""}-${i.cakeMessage || ""}-${i.occasion || ""}-${i.recipientName || ""}` === key
                ? { ...i, quantity: Math.min(i.quantity + 1, 50) }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }] });
        }
      },

      removeItem: (productId, variantName) => {
        // Remove only the first matching item (not all with same productId+variant)
        const { items } = get();
        const idx = items.findIndex(
          (i) => i.productId === productId && (i.variantName || "") === (variantName || "")
        );
        if (idx !== -1) {
          set({ items: [...items.slice(0, idx), ...items.slice(idx + 1)] });
        }
      },

      updateQuantity: (productId, quantity, variantName) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantName);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId && (i.variantName || "") === (variantName || "")
              ? { ...i, quantity }
              : i
          ),
        });
      },

      updateItemAddOns: (productId, addOns, variantName) => {
        set({
          items: get().items.map((i) =>
            i.productId === productId && (i.variantName || "") === (variantName || "")
              ? { ...i, addOns }
              : i
          ),
        });
      },

      updateItemPrice: (productId, price, variantName, flavour) => {
        set({
          items: get().items.map((i) =>
            i.productId === productId &&
            (i.variantName || "") === (variantName || "") &&
            (!flavour || (i.flavour || "") === flavour)
              ? { ...i, unitPrice: price }
              : i
          ),
        });
      },

      clearCart: () =>
        set({ items: [], specialInstructions: "" }),

      setStoreSlug: (slug) => {
        const current = get().storeSlug;
        if (current && current !== slug && get().items.length > 0) {
          // Different store with items — warn user (handled in UI)
          if (typeof window !== "undefined" && !window.confirm("Switching stores will clear your cart. Continue?")) {
            return;
          }
          set({ items: [], storeSlug: slug, specialInstructions: "" });
        } else {
          set({ storeSlug: slug });
        }
      },

      setOrderType: (type) => set({ orderType: type }),
      setSpecialInstructions: (instructions) =>
        set({ specialInstructions: instructions }),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, i) => {
          const addOnTotal = (i.addOns || []).reduce((a, o) => a + o.price, 0);
          return sum + (i.unitPrice + addOnTotal) * i.quantity;
        }, 0),
    }),
    {
      name: "bliss-bakery-cart",
    }
  )
);
