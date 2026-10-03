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

/** Identity of a cart line: the same cake in another size, flavour or message is a separate line. */
export const lineKey = (i: Pick<CartItem, "productId" | "variantName" | "flavour" | "cakeMessage" | "occasion" | "recipientName">) =>
  `${i.productId}-${i.variantName || ""}-${i.flavour || ""}-${i.cakeMessage || ""}-${i.occasion || ""}-${i.recipientName || ""}`;

const MAX_QTY = 50;

interface CartState {
  items: CartItem[];
  /** Basket-level add-ons from the outlet's shelf: add-on id -> quantity. */
  extras: Record<string, number>;
  storeSlug: string | null;
  orderType: "PICKUP" | "DELIVERY";
  specialInstructions: string;

  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setLineQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  setExtra: (id: string, quantity: number) => void;
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
      extras: {},
      storeSlug: null,
      orderType: "PICKUP",
      specialInstructions: "",

      addItem: (item, quantity = 1) => {
        const { items } = get();
        const key = lineKey(item);
        const add = Math.max(1, Math.floor(quantity));
        if (items.some((i) => lineKey(i) === key)) {
          set({
            items: items.map((i) =>
              lineKey(i) === key ? { ...i, quantity: Math.min(i.quantity + add, MAX_QTY) } : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity: Math.min(add, MAX_QTY) }] });
        }
      },

      setLineQuantity: (key, quantity) => {
        if (quantity <= 0) { get().removeLine(key); return; }
        set({ items: get().items.map((i) => (lineKey(i) === key ? { ...i, quantity: Math.min(quantity, MAX_QTY) } : i)) });
      },

      removeLine: (key) => set({ items: get().items.filter((i) => lineKey(i) !== key) }),

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
        set({ items: [], extras: {}, specialInstructions: "" }),

      setExtra: (id, qty) => {
        const extras = { ...(get().extras ?? {}) };
        if (qty > 0) extras[id] = qty; else delete extras[id];
        set({ extras });
      },

      setStoreSlug: (slug) => {
        const current = get().storeSlug;
        // A basket cannot move between outlets — they have separate menus and prices.
        if (current && current !== slug && (get().items.length > 0 || Object.keys(get().extras ?? {}).length > 0)) {
          set({ items: [], extras: {}, storeSlug: slug, specialInstructions: "" });
          return;
        }
        set({ storeSlug: slug });
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
