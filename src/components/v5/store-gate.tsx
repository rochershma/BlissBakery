"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { IconPin } from "./icons";

type StoreOption = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  pincode: string | null;
  address: string | null;
};

/**
 * First-run outlet chooser. Prices, menu and delivery all differ per outlet, so
 * the customer picks one before they can browse. Skipped entirely when there is
 * only one outlet to choose from — a wall with a single option helps nobody.
 */
export function StoreGate({ chosen }: { chosen: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const setStoreSlug = useCartStore((s) => s.setStoreSlug);
  const [stores, setStores] = useState<StoreOption[] | null>(null);
  const [busy, setBusy] = useState("");

  // Admins work across outlets and pick theirs in the admin header instead.
  const skip = Boolean(chosen) || pathname.startsWith("/admin");

  useEffect(() => {
    if (skip) return;
    fetch("/api/stores")
      .then((r) => r.json())
      .then((d) => setStores(Array.isArray(d?.stores) ? d.stores : []))
      .catch(() => setStores([]));
  }, [skip]);

  // One outlet needs no decision — remember it and get out of the way.
  useEffect(() => {
    if (skip || !stores || stores.length !== 1) return;
    const only = stores[0];
    fetch("/api/stores/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: only.slug }),
    })
      .then(() => {
        setStoreSlug(only.slug);
        router.refresh();
      })
      .catch(() => {});
  }, [skip, stores, router, setStoreSlug]);

  useEffect(() => {
    const open = !skip && !!stores && stores.length > 1;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [skip, stores]);

  if (skip || !stores || stores.length <= 1) return null;

  const choose = async (slug: string) => {
    setBusy(slug);
    try {
      const res = await fetch("/api/stores/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) throw new Error();
      setStoreSlug(slug);
      router.refresh();
    } catch {
      setBusy("");
    }
  };

  return (
    <div className="gate" role="dialog" aria-modal="true" aria-labelledby="gate-h">
      <div className="gate__panel">
        <span className="gate__ic"><IconPin /></span>
        <h2 className="gate__h" id="gate-h">Where are you ordering from?</h2>
        <p className="gate__p">Menus, prices and delivery times differ by outlet.</p>

        <div className="gate__list">
          {stores.map((s) => (
            <button
              type="button"
              key={s.id}
              className="gate__i"
              disabled={!!busy}
              onClick={() => choose(s.slug)}
            >
              <span className="gate__tx">
                <b>{s.name}</b>
                <span>{s.address || [s.city, s.pincode].filter(Boolean).join(" · ")}</span>
              </span>
              <em>{busy === s.slug ? "…" : "Select"}</em>
            </button>
          ))}
        </div>

        <p className="gate__note">You can switch outlets any time from the header.</p>
      </div>
    </div>
  );
}
