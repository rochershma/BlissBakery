"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useToast } from "@/components/shared/toast";

/**
 * Reorder is the only self-service action on a past order. Cancelling is
 * deliberately not offered — once an order is placed the kitchen may already be
 * working on it, so changes go through the store.
 */
export function OrderActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const setStoreSlug = useCartStore((s) => s.setStoreSlug);
  const [busy, setBusy] = useState(false);

  const reorder = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/reorder`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not reorder");

      if (!data.items?.length) {
        toast("None of these items are on the menu right now", "error");
        return;
      }

      if (data.storeSlug) setStoreSlug(data.storeSlug);
      for (const item of data.items) {
        const { quantity, ...line } = item;
        addItem(line);
        if (quantity > 1) updateQuantity(line.productId, quantity, line.variantName);
      }

      if (data.unavailable?.length) {
        toast(`Added. ${data.unavailable.length} item(s) are no longer available.`, "error");
      } else {
        toast("Added to your cart");
      }
      router.push("/cart");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not reorder", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" className="btn btn--out btn--sm" disabled={busy} onClick={reorder}>
      {busy ? "Adding…" : "Reorder"}
    </button>
  );
}
