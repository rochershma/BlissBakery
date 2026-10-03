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

const label = (s: { city: string | null; name: string }) => s.city || s.name;

/**
 * Store chooser for the storefront. One trigger and one panel at every size —
 * a dropdown on desktop, a bottom sheet on phones. `variant="strip"` renders the
 * trigger as the "Ordering from …" line on the homepage.
 */
export function StorePicker({
  storeSlug,
  storeCity,
  pincode,
  variant = "pill",
}: {
  storeSlug: string;
  storeCity: string;
  pincode: string;
  variant?: "pill" | "strip";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState<StoreOption[] | null>(null);
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

  const choose = async (store: StoreOption) => {
    setOpen(false);
    if (store.slug === storeSlug) return;
    // Persist before navigating: pages outside /store/[slug] read the cookie,
    // so without this the choice is lost on the next refresh.
    await fetch("/api/stores/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: store.slug }),
    }).catch(() => {});

    // Each outlet has its own menu and prices, so a basket never moves with the customer.
    clearCart();
    setCartStore(store.slug);

    // Stay on the same kind of page where there is an equivalent, otherwise go
    // home — a product or category from the old outlet won't exist here.
    router.push(pathname.startsWith("/store/") ? `/store/${store.slug}/menu` : "/");
    router.refresh();
    toast(`Now ordering from ${label(store)}`);
  };

  const here = storeCity || pincode;

  return (
    <div className={`v5store${variant === "strip" ? " v5store--strip" : ""}`}>
      {variant === "strip" ? (
        <button type="button" className="v5here" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="dialog">
          <IconPin />
          <span>Ordering from <b>{here}</b></span>
          <em>Change</em>
        </button>
      ) : (
        <button
          type="button"
          className="v5loc"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={`Store: ${here}. Change store`}
        >
          <IconPin />
          <span className="v5loc__t">
            <small>Ordering from</small>
            <b>{here}</b>
          </span>
          <IconChevD width={14} height={14} />
        </button>
      )}

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
                        <b>{label(s)}</b>
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
    </div>
  );
}
