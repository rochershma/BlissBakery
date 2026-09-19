"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { img } from "@/lib/img";
import { SiteFooter } from "@/components/v5/site-footer";
import { IconBag, IconChevL, IconTrash } from "@/components/v5/icons";

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const storeSlug = useCartStore((s) => s.storeSlug) ?? "kuchaman-city";
  const [hydrated, setHydrated] = useState(false);
  const [charges, setCharges] = useState({ packaging: 10, delivery: 30 });

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    fetch("/api/store/config")
      .then((r) => r.json())
      .then((d) => {
        if (d?.packagingCharge != null || d?.deliveryCharge != null) {
          setCharges({ packaging: d.packagingCharge ?? 10, delivery: d.deliveryCharge ?? 30 });
        }
      })
      .catch(() => {});
  }, []);

  const subtotal = items.reduce(
    (s, i) => s + (i.unitPrice + (i.addOns ?? []).reduce((a, x) => a + x.price, 0)) * i.quantity,
    0,
  );
  const total = subtotal + charges.packaging + charges.delivery;

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
        <div>
          {items.map((it) => {
            const key = `${it.productId}-${it.variantName ?? ""}-${it.flavour ?? ""}-${it.cakeMessage ?? ""}`;
            const addOnTotal = (it.addOns ?? []).reduce((a, x) => a + x.price, 0);
            return (
              <div className="crow" key={key}>
                <Link href={`/store/${storeSlug}/menu/${it.productSlug ?? ""}`} className="crow__i">
                  {it.image ? <Image src={img(it.image, 200, 200)} alt="" width={200} height={200} unoptimized /> : null}
                </Link>
                <div className="crow__body">
                  <div className="crow__top">
                    <span className="veg" aria-label="Pure veg" />
                    <Link href={`/store/${storeSlug}/menu/${it.productSlug ?? ""}`}>
                      <b className="crow__name">{it.name}</b>
                    </Link>
                  </div>
                  <div className="crow__tags">
                    {it.variantName ? <span className="badge badge--soft">{it.variantName}</span> : null}
                    {it.flavour ? <span className="badge badge--soft">{it.flavour}</span> : null}
                  </div>
                  {it.cakeMessage ? (
                    <p className="t-small crow__msg">On the cake — “<b>{it.cakeMessage}</b>”</p>
                  ) : null}
                  {(it.addOns ?? []).length > 0 ? (
                    <p className="t-small">{it.addOns!.map((a) => a.name).join(", ")} · {formatPrice(addOnTotal)}</p>
                  ) : null}
                  <div className="crow__ctl">
                    <div className="qty">
                      <button type="button" aria-label="Decrease" disabled={it.quantity <= 1}
                        onClick={() => updateQuantity(it.productId, it.quantity - 1, it.variantName)}>−</button>
                      <span>{it.quantity}</span>
                      <button type="button" aria-label="Increase"
                        onClick={() => updateQuantity(it.productId, it.quantity + 1, it.variantName)}>+</button>
                    </div>
                    <button type="button" className="btn btn--ghost btn--sm crow__rm"
                      onClick={() => removeItem(it.productId, it.variantName)}>
                      <IconTrash /> Remove
                    </button>
                  </div>
                </div>
                <b className="t-num crow__price">{formatPrice((it.unitPrice + addOnTotal) * it.quantity)}</b>
              </div>
            );
          })}

          <Link className="btn btn--out btn--sm cart5__more" href={`/store/${storeSlug}/menu`}>
            + Add more items
          </Link>
        </div>

        <aside className="summary5">
          <h3 className="t-h3">Bill details</h3>
          <div className="sline"><span>Item total</span><b>{formatPrice(subtotal)}</b></div>
          <div className="sline"><span>Safe cake packaging</span><b>{formatPrice(charges.packaging)}</b></div>
          <div className="sline"><span>Delivery</span><b>{formatPrice(charges.delivery)}</b></div>
          <div className="sline sline--tot"><span>To pay</span><b>{formatPrice(total)}</b></div>
          <button type="button" className="btn btn--rose btn--block btn--lg summary5__cta" style={{ marginTop: 16 }}
            onClick={() => router.push("/checkout")}>
            Continue to delivery
          </button>
          <div className="summary5__trust">
            <span className="t-small"><span className="veg" /> 100% eggless</span>
            <span className="t-small">FSSAI licensed</span>
          </div>
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
