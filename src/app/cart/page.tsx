"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore, lineKey } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { img } from "@/lib/img";
import { SiteFooter } from "@/components/v5/site-footer";
import { AddOnsPicker, type AddOn } from "@/components/v5/addons-picker";
import { useToast } from "@/components/shared/toast";
import { IconBag, IconChevL, IconTrash, IconPlus } from "@/components/v5/icons";

const NO_EXTRAS: Record<string, number> = {};

export default function CartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const items = useCartStore((s) => s.items);
  const extras = useCartStore((s) => s.extras) ?? NO_EXTRAS;
  const setExtra = useCartStore((s) => s.setExtra);
  const setLineQuantity = useCartStore((s) => s.setLineQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const storeSlug = useCartStore((s) => s.storeSlug) ?? "kuchaman-city";
  const [hydrated, setHydrated] = useState(false);
  const [charges, setCharges] = useState({ packaging: 10, delivery: 30 });
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [maxQty, setMaxQty] = useState(20);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    fetch("/api/store/config")
      .then((r) => r.json())
      .then((d) => {
        if (d?.packagingCharge != null || d?.deliveryCharge != null) {
          setCharges({ packaging: d.packagingCharge ?? 10, delivery: d.deliveryCharge ?? 30 });
        }
        if (Array.isArray(d?.addOns)) setAddOns(d.addOns);
        if (d?.addOnMaxQty) setMaxQty(Math.max(1, d.addOnMaxQty));
      })
      .catch(() => {});
  }, []);

  const subtotal = items.reduce(
    (s, i) => s + (i.unitPrice + (i.addOns ?? []).reduce((a, x) => a + x.price, 0)) * i.quantity,
    0,
  );
  const addOnTotal = useMemo(
    () => Object.entries(extras).reduce((s, [id, q]) => s + (addOns.find((a) => a.id === id)?.price ?? 0) * q, 0),
    [extras, addOns],
  );
  // Delivery is excluded here on purpose — the fulfilment method (delivery vs free
  // pickup) is chosen at checkout, so the cart only shows what we can charge now.
  const total = subtotal + addOnTotal + charges.packaging;

  if (!hydrated) {
    return (
      <div className="wrap" style={{ padding: "40px 0" }}>
        <div className="sk" style={{ height: 28, width: 180 }} />
        <div className="sk" style={{ height: 120, marginTop: 18 }} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <div className="wrap cart5__head">
          <Link href={`/store/${storeSlug}/menu`} className="v5ibtn cart5__back" aria-label="Back">
            <IconChevL />
          </Link>
          <h1 className="t-h1">Your cart</h1>
        </div>
        <div className="wrap">
          <div className="v5empty" style={{ maxWidth: 480, margin: "20px auto 60px" }}>
            <IconBag />
            <h3 className="t-h3">Your cart is empty</h3>
            <p className="t-small">Nothing in the box yet. Browse the menu and add a cake.</p>
            <Link className="btn btn--rose btn--sm" href={`/store/${storeSlug}/menu`}>Browse cakes</Link>
          </div>
        </div>
        <SiteFooter storeSlug={storeSlug} className="ftr--desktop" />
      </>
    );
  }

  return (
    <>
      <div className="wrap cart5__head">
        <Link href={`/store/${storeSlug}/menu`} className="v5ibtn cart5__back" aria-label="Back">
          <IconChevL />
        </Link>
        <div>
          <h1 className="t-h1">Your cart</h1>
          <p className="t-small">{items.length} {items.length === 1 ? "item" : "items"}</p>
        </div>
      </div>

      <div className="wrap cart5">
        <div className="cart5__main">
          <div className="cart5__items">
          {items.map((it) => {
            const key = lineKey(it);
            const lineAddOns = (it.addOns ?? []).reduce((a, x) => a + x.price, 0);
            return (
              <div className="crow" key={key}>
                <Link href={`/store/${storeSlug}/menu/${it.productSlug ?? ""}`} className="crow__i">
                  {it.image ? <Image src={img(it.image, 200, 200)} alt="" width={200} height={200} unoptimized /> : null}
                </Link>
                <div className="crow__body">
                  <div className="crow__top">
                    <span className="veg" aria-label="Pure veg" />
                    <Link href={`/store/${storeSlug}/menu/${it.productSlug ?? ""}`} className="crow__name">{it.name}</Link>
                    <button type="button" className="crow__x" aria-label="Remove" onClick={() => removeLine(key)}><IconTrash /></button>
                  </div>
                  {[it.variantName, it.flavour].filter(Boolean).length ? (
                    <p className="crow__sub">{[it.variantName, it.flavour].filter(Boolean).join(" · ")}</p>
                  ) : null}
                  {it.cakeMessage ? (
                    <p className="t-small crow__msg">On the cake — “<b>{it.cakeMessage}</b>”</p>
                  ) : null}
                  {(it.addOns ?? []).length > 0 ? (
                    <p className="t-small crow__addons">{it.addOns!.map((a) => a.name).join(", ")} · {formatPrice(lineAddOns)}</p>
                  ) : null}
                  <div className="crow__foot">
                    <div className="qty qty--sm">
                      <button type="button" aria-label="Decrease" disabled={it.quantity <= 1}
                        onClick={() => setLineQuantity(key, it.quantity - 1)}>−</button>
                      <span>{it.quantity}</span>
                      <button type="button" aria-label="Increase" disabled={it.quantity >= 50}
                        onClick={() => setLineQuantity(key, it.quantity + 1)}>+</button>
                    </div>
                    <b className="t-num crow__price">{formatPrice((it.unitPrice + lineAddOns) * it.quantity)}</b>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          <Link className="cart5__more" href={`/store/${storeSlug}/menu`}>
            <IconPlus /> Add more items
          </Link>

          <AddOnsPicker
            addOns={addOns}
            picked={extras}
            maxQty={maxQty}
            onChange={setExtra}
            onLimit={(name) => toast(`Up to ${maxQty} ${name} per order`, "error")}
          />
        </div>

        <aside className="summary5">
          <h3 className="t-h3">Bill details</h3>
          <div className="sline"><span>Item total</span><b>{formatPrice(subtotal)}</b></div>
          {addOnTotal > 0 ? <div className="sline"><span>Add-ons</span><b>{formatPrice(addOnTotal)}</b></div> : null}
          <div className="sline"><span>Packaging</span><b>{formatPrice(charges.packaging)}</b></div>
          <div className="sline sline--tot"><span>Estimated total</span><b>{formatPrice(total)}</b></div>
          <p className="cart5__note">Delivery charge is added at checkout when you choose delivery — pickup is free.</p>
          <button type="button" className="btn btn--rose btn--block btn--lg summary5__cta" style={{ marginTop: 14 }}
            onClick={() => router.push("/checkout")}>
            Proceed to checkout
          </button>
        </aside>
      </div>

      <div className="msticky">
        <div>
          <div className="t-small" style={{ fontSize: 11, lineHeight: 1.2 }}>Total</div>
          <b className="t-num" style={{ fontFamily: "var(--font-jakarta)", fontSize: 19, fontWeight: 800, letterSpacing: "-.03em" }}>
            {formatPrice(total)}
          </b>
        </div>
        <button type="button" className="btn btn--rose" style={{ flex: 1, height: 48 }} onClick={() => router.push("/checkout")}>
          Continue
        </button>
      </div>

      <SiteFooter storeSlug={storeSlug} className="ftr--desktop" />
    </>
  );
}
