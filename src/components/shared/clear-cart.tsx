"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";

export function ClearCartOnMount() {
  useEffect(() => {
    const { items, clearCart } = useCartStore.getState();
    if (items.length > 0) {
      clearCart();
    }
  }, []);
  return null;
}
