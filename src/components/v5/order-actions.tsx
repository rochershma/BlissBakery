"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useToast } from "@/components/shared/toast";
import { useConfirm } from "@/components/shared/confirm-dialog";

/** Statuses a customer may still call off themselves. */
const CANCELLABLE = ["PENDING", "CONFIRMED"];

export function OrderActions({
  orderId,
  status,
  onChanged,
}: {
  orderId: string;
  status: string;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const setStoreSlug = useCartStore((s) => s.setStoreSlug);
  const [busy, setBusy] = useState("");

  const reorder = async () => {
    setBusy("reorder");
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
      setBusy("");
    }
  };

  const cancel = async () => {
    const ok = await confirm({
      title: "Cancel this order?",
      message: "We'll stop preparing it right away. This cannot be undone.",
      confirmLabel: "Cancel order",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!ok) return;

    setBusy("cancel");
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not cancel");
      toast("Order cancelled");
      onChanged ? onChanged() : router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not cancel", "error");
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <button type="button" className="btn btn--out btn--sm" disabled={!!busy} onClick={reorder}>
        {busy === "reorder" ? "Adding…" : "Reorder"}
      </button>
      {CANCELLABLE.includes(status) ? (
        <button type="button" className="btn btn--ghost btn--sm order5__cancel" disabled={!!busy} onClick={cancel}>
          {busy === "cancel" ? "Cancelling…" : "Cancel order"}
        </button>
      ) : null}
    </>
  );
}
