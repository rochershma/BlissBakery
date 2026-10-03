import { useCartStore, lineKey } from "@/store/cart";

type PriceUpdate = { productId: string; variantName?: string; flavour?: string; correctPrice: number };

/**
 * Reconciles the locally-cached cart prices against the live server prices.
 * The cart stores a `unitPrice` snapshot taken when the item was added, so an
 * admin re-pricing (or disabling) a product would otherwise leave the cart
 * showing a stale figure that silently differs from what the order is charged.
 * Call this on the cart and checkout screens; it mutates the Zustand store in
 * place and reports what changed so the caller can notify the customer.
 */
export async function reconcileCartPrices(): Promise<{ changed: boolean; removed: boolean }> {
  const { items } = useCartStore.getState();
  if (!items.length) return { changed: false, removed: false };

  let res: Response;
  try {
    res = await fetch("/api/cart/verify-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.productId,
          variantName: i.variantName,
          flavour: i.flavour,
          unitPrice: i.unitPrice,
        })),
      }),
    });
  } catch {
    return { changed: false, removed: false };
  }
  if (!res.ok) return { changed: false, removed: false };

  const data = await res.json().catch(() => ({}));
  const updates: PriceUpdate[] = Array.isArray(data?.updates) ? data.updates : [];
  if (!updates.length) return { changed: false, removed: false };

  const store = useCartStore.getState();
  let changed = false;
  let removed = false;

  for (const u of updates) {
    if (u.correctPrice < 0) {
      // Product is no longer available — drop every matching line.
      for (const it of useCartStore.getState().items) {
        if (
          it.productId === u.productId &&
          (it.variantName || "") === (u.variantName || "") &&
          (!u.flavour || (it.flavour || "") === (u.flavour || ""))
        ) {
          store.removeLine(lineKey(it));
          removed = true;
        }
      }
    } else {
      store.updateItemPrice(u.productId, u.correctPrice, u.variantName, u.flavour);
      changed = true;
    }
  }

  return { changed, removed };
}
