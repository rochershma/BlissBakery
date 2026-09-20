"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useToast } from "@/components/shared/toast";
import { IconPin, IconChevD, IconCheck } from "./icons";

type StoreOption = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  pincode: string | null;
  address: string | null;
};

/**
 * Store chooser for the storefront. One trigger and one panel at every size —
 * a dropdown on desktop, a bottom sheet on phones.
 */
export function StorePicker({
  storeSlug,
  storeCity,
  pincode,
}: {
  storeSlug: string;
  storeCity: string;
  pincode: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState<StoreOption[] | null>(null);
  const [confirming, setConfirming] = useState<StoreOption | null>(null);
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const setCartStore = useCartStore((s) => s.setStoreSlug);

  useEffect(() => {
    if (!open || stores) return;
    fetch("/api/stores")
      .then((r) => r.json())
      .then((d) => setStores(Array.isArray(d?.stores) ? d.stores : []))
      .catch(() => setStores([]));
  }, [open, stores]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    // Only the sheet locks scrolling; on desktop the dropdown leaves the page usable.
    if (window.matchMedia("(max-width: 1023px)").matches) document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const switchTo = async (store: StoreOption) => {
    // Persist before navigating: pages outside /store/[slug] read the cookie,
    // so without this the choice is lost on the next refresh.
    await fetch("/api/stores/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: store.slug }),
    }).catch(() => {});

    clearCart();
    setCartStore(store.slug);

    // Stay on the same kind of page where there is an equivalent, otherwise go
    // home — a product or category from the old outlet won't exist here.
    router.push(pathname.startsWith("/store/") ? `/store/${store.slug}/menu` : "/");
    router.refresh();
    toast(`Now ordering from ${store.name}`);
  };

  const choose = (store: StoreOption) => {
    setOpen(false);
    if (store.slug === storeSlug) return;
    // Prices and the menu itself differ per outlet, so a basket cannot move.
    if (items.length > 0) { setConfirming(store); return; }
    void switchTo(store);
  };

  return (
    <div className="v5store">
      <button
        type="button"
        className="v5loc"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Store: ${storeCity || pincode}. Change store`}
      >
        <IconPin />
        <span className="v5loc__t">
          <small>Deliver from</small>
          <b>{storeCity || pincode}</b>
        </span>
        <IconChevD width={14} height={14} />
      </button>

      {open ? (
        <>
          <div className="v5store__bg" onClick={() => setOpen(false)} />
          <div className="v5store__pop" role="dialog" aria-label="Choose a store">
            <div className="v5store__head">
              <b>Choose your store</b>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>

            <div className="v5store__list">
              {stores === null ? (
                <p className="v5store__msg">Loading stores…</p>
              ) : stores.length === 0 ? (
                <p className="v5store__msg">No stores are open right now.</p>
              ) : (
                stores.map((s) => {
                  const current = s.slug === storeSlug;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      className="v5store__i"
                      aria-current={current}
                      onClick={() => choose(s)}
                    >
                      <span className="v5store__ic"><IconPin /></span>
                      <span className="v5store__tx">
                        <b>{s.name}</b>
                        <span>{s.address || [s.city, s.pincode].filter(Boolean).join(" · ")}</span>
                      </span>
                      {current ? <IconCheck /> : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      ) : null}

      {confirming ? (
        <>
          <div className="v5store__bg" onClick={() => setConfirming(null)} />
          <div className="v5swap" role="alertdialog" aria-labelledby="v5swap-t">
            <h3 id="v5swap-t">Switch to {confirming.name}?</h3>
            <p>
              Your basket has {items.reduce((n, i) => n + i.quantity, 0)} item
              {items.reduce((n, i) => n + i.quantity, 0) === 1 ? "" : "s"} from {storeCity}. Each outlet bakes
              its own menu at its own prices, so we&apos;ll empty the basket before you carry on.
            </p>
            <div className="v5swap__acts">
              <button type="button" className="btn btn--out btn--sm" onClick={() => setConfirming(null)}>
                Stay at {storeCity}
              </button>
              <button
                type="button"
                className="btn btn--rose btn--sm"
                onClick={() => { const s = confirming; setConfirming(null); void switchTo(s); }}
              >
                Switch &amp; clear basket
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
