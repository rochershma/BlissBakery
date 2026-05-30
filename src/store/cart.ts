"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  image?: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  addOns?: { name: string; price: number }[];
}

interface CartState {
  items: CartItem[];
  storeSlug: string | null;
  orderType: "PICKUP" | "DELIVERY";
  specialInstructions: string;

  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string, variantName?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantName?: string) => void;
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
        const { items, storeSlug } = get();
        const key = `${item.productId}-${item.variantName || ""}`;
        const existing = items.find(
          (i) => `${i.productId}-${i.variantName || ""}` === key
        );

        if (existing) {
          set({
            items: items.map((i) =>
              `${i.productId}-${i.variantName || ""}` === key
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }] });
        }
      },

      removeItem: (productId, variantName) => {
        set({
          items: get().items.filter(
            (i) =>
              !(i.productId === productId && (i.variantName || "") === (variantName || ""))
          ),
        });
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

      clearCart: () =>
        set({ items: [], specialInstructions: "" }),

      setStoreSlug: (slug) => {
        const current = get().storeSlug;
        if (current && current !== slug) {
          // Different store — clear cart
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
