"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/shared/toast";
import { formatPrice } from "@/lib/utils";
import { img } from "@/lib/img";
import { SiteFooter } from "@/components/v5/site-footer";
import { AddOnsPicker, type AddOn } from "@/components/v5/addons-picker";
import { AddressForm, type SavedAddress } from "@/components/v5/address-form";
import { DEFAULT_SLOTS, parseSlots, slotsForDate, type DeliverySlot } from "@/lib/slots";
import { IconChevL, IconPlus, IconCake, IconUser, IconPin } from "@/components/v5/icons";

type Verdict = { deliverable: boolean; fee: number; distanceKm: number | null; reason: string | null };

/** Next 7 delivery days, rendered as chips instead of a native date field. */
const DAYS = Array.from({ length: 7 }, (_, n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return {
    iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    dow: n === 0 ? "Today" : n === 1 ? "Tmrw" : d.toLocaleDateString("en-IN", { weekday: "short" }),
    day: String(d.getDate()).padStart(2, "0"),
    mon: d.toLocaleDateString("en-IN", { month: "short" }),
  };
});

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading, setShowLoginModal } = useAuth();
  const { toast } = useToast();

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const cartSlug = useCartStore((s) => s.storeSlug);

  const [hydrated, setHydrated] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addrId, setAddrId] = useState("");
  const [checks, setChecks] = useState<Record<string, Verdict>>({});
  const [newAddr, setNewAddr] = useState(false);
  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [charges, setCharges] = useState({ packaging: 10, delivery: 30, gstRate: 0, minOrder: 0 });
  const [area, setArea] = useState({ city: "", pincodes: [] as string[] });
  const [outlet, setOutlet] = useState({ name: "", slug: "", address: "", phone: "" });
  // The outlet the server resolved from the cookie is the one that bakes this
  // order — the cart only remembers where the basket was filled.
  const storeSlug = outlet.slug || cartSlug || "";
  const staleBasket = Boolean(outlet.slug && cartSlug && cartSlug !== outlet.slug && items.length > 0);
  const [slotCfg, setSlotCfg] = useState<{ slots: DeliverySlot[]; leadHours: number; maxQty: number }>({
    slots: DEFAULT_SLOTS,
    leadHours: 4,
    maxQty: 20,
  });
  const [placing, setPlacing] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number; basis: number } | null>(null);
  const [promoErr, setPromoErr] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [offers, setOffers] = useState<{ code: string; occasionTag: string | null }[]>([]);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!authLoading && !user) setShowLoginModal(true);
  }, [authLoading, user, setShowLoginModal]);

  useEffect(() => {
    fetch("/api/store/config").then((r) => r.json()).then((d) => {
      if (d) {
        setCharges({
          packaging: d.packagingCharge ?? 10,
          delivery: d.deliveryCharge ?? 30,
          gstRate: d.gstRate ?? 0,
          minOrder: d.minDeliveryOrder ?? 0,
        });
        setSlotCfg({
          slots: parseSlots(d.deliverySlots),
          leadHours: d.orderLeadHours ?? 4,
          maxQty: Math.max(1, d.addOnMaxQty ?? 20),
        });
        const pincodes: string[] = Array.isArray(d.servicePincodes) && d.servicePincodes.length
          ? d.servicePincodes
          : [d.pincode].filter(Boolean);
        setArea({ city: d.city ?? "", pincodes });
        setOutlet({ name: d.name ?? "", slug: d.slug ?? "", address: d.address ?? "", phone: d.phone ?? "" });
      }
      if (Array.isArray(d?.addOns)) setAddOns(d.addOns);
    }).catch(() => toast("Couldn't load delivery charges — please refresh", "error"));
  }, [toast]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/addresses").then((r) => r.json()).then((d) => {
      const list: SavedAddress[] = d?.addresses ?? [];
      setAddresses(list);
      if (list.length === 0) setNewAddr(true);
    }).catch(() => setNewAddr(true));
    fetch(`/api/promo/list?store=${encodeURIComponent(storeSlug)}`).then((r) => r.json()).then((d) => {
      // only tagged offers are promoted as one-tap chips
      if (Array.isArray(d?.promos)) setOffers(d.promos.filter((p: { occasionTag: string | null }) => p.occasionTag).slice(0, 3));
    }).catch(() => {});
  }, [user, storeSlug]);

  const subtotal = items.reduce(
    (s, i) => s + (i.unitPrice + (i.addOns ?? []).reduce((a, x) => a + x.price, 0)) * i.quantity, 0);
  const addOnTotal = useMemo(
    () => Object.entries(picked).reduce((s, [id, q]) => s + (addOns.find((a) => a.id === id)?.price ?? 0) * q, 0),
    [picked, addOns]);
  // Whether this outlet reaches each saved address, and what it charges. Asked
  // again on every render of the list because the answer changes with the outlet.
  useEffect(() => {
    if (addresses.length === 0) return;
    let live = true;
    Promise.all(
      addresses.map((a) =>
        fetch(`/api/delivery/check?addressId=${a.id}`)
          .then((r) => r.json())
          .then((v) => [a.id, v as Verdict] as const)
          .catch(() => [a.id, { deliverable: false, fee: 0, distanceKm: null, reason: "Couldn't check this address" }] as const),
      ),
    ).then((pairs) => { if (live) setChecks(Object.fromEntries(pairs)); });
    return () => { live = false; };
  }, [addresses]);

  // Never leave an unreachable address selected — that order would be rejected.
  useEffect(() => {
    if (Object.keys(checks).length === 0) return;
    const stillGood = addrId && checks[addrId]?.deliverable;
    if (stillGood) return;
    const first = addresses.find((a) => checks[a.id]?.deliverable);
    setAddrId(first?.id ?? "");
  }, [checks, addresses, addrId]);

  const verdict = addrId ? checks[addrId] : null;
  const delivery = orderType === "PICKUP" ? 0 : verdict?.fee ?? charges.delivery;
  // A cart edit can invalidate a minimum-order promo, so it only counts
  // while the subtotal it was priced against still holds.
  const activePromo = promo && promo.basis === subtotal ? promo : null;
  const discount = activePromo?.discount ?? 0;
  // Mirrors the server's maths in /api/orders/create so the quoted total is what we charge.
  const taxable = Math.max(0, subtotal + addOnTotal + charges.packaging + delivery - discount);
  const gst = taxable * (charges.gstRate / 100);
  const total = taxable + gst;
  const shortBy = orderType === "DELIVERY" ? Math.max(0, charges.minOrder - subtotal) : 0;

  // Slots are store-configured and same-day options disappear once prep time can't be met.
  const slotOptions = useMemo(
    () => slotsForDate(slotCfg.slots, date, slotCfg.leadHours),
    [slotCfg, date],
  );

  useEffect(() => {
    if (slotOptions.length === 0) { setSlot(""); return; }
    setSlot((cur) => (slotOptions.some((s) => s.label === cur) ? cur : slotOptions[0].label));
  }, [slotOptions]);

  // Late in the day nothing can be prepared in time, so start the customer on
  // the first date that still has a slot rather than on a dead end.
  useEffect(() => {
    if (slotOptions.length > 0) return;
    const next = DAYS.find(
      (d) => d.iso > date && slotsForDate(slotCfg.slots, d.iso, slotCfg.leadHours).length > 0,
    );
    if (next) setDate(next.iso);
  }, [slotOptions, slotCfg, date]);

  const applyPromo = async (raw?: string) => {
    const code = (raw ?? promoInput).trim().toUpperCase();
    if (!code) return;
    setPromoBusy(true);
    setPromoErr("");
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal, storeSlug }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d?.message ?? "Invalid promo code");
      setPromo({ code: d.code, discount: d.discount, basis: subtotal });
      setPromoInput("");
      toast(d.message ?? "Promo applied", "success");
    } catch (e) {
      setPromo(null);
      setPromoErr(e instanceof Error ? e.message : "Could not apply that code");
    } finally {
      setPromoBusy(false);
    }
  };

  const bump = (id: string, qty: number) =>
    setPicked((p) => {
      const next = { ...p };
      qty > 0 ? (next[id] = qty) : delete next[id];
      return next;
    });

  const placeOrder = async () => {
    if (!user) { setShowLoginModal(true); return; }
    if (items.length === 0) { toast("Your cart is empty", "error"); return; }
    if (orderType === "DELIVERY" && !addrId) { toast("Choose a delivery address", "error"); return; }
    if (orderType === "DELIVERY" && verdict && !verdict.deliverable) { toast(verdict.reason ?? "We can't deliver there", "error"); return; }
    if (shortBy > 0) { toast(`Add ${formatPrice(shortBy)} more to meet the ${formatPrice(charges.minOrder)} delivery minimum`, "error"); return; }
    if (!slot) { toast("Pick a delivery slot", "error"); return; }

    setPlacing(true);
    try {
      // checkout add-ons ride along on the first line item
      const extras = Object.entries(picked).flatMap(([id, q]) => {
        const a = addOns.find((x) => x.id === id);
        return a ? Array.from({ length: q }, () => ({ name: a.name, price: a.price })) : [];
      });

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          orderType,
          addressId: orderType === "DELIVERY" ? addrId : undefined,
          deliveryDate: date,
          deliverySlot: slot,
          promoCode: activePromo?.code,
          specialInstructions: notes || undefined,
          items: items.map((i, idx) => ({
            productId: i.productId,
            name: i.name,
            variantName: i.variantName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            flavour: i.flavour,
            cakeMessage: i.cakeMessage,
            addOns: [...(i.addOns ?? []), ...(idx === 0 ? extras : [])],
          })),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.message ?? d?.error ?? "Could not place the order");
      clearCart();
      const id = d.order?.id ?? d.orderId ?? d.id ?? "";
      router.push(id ? `/order/${id}` : "/orders");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong", "error");
      setPlacing(false);
    }
  };

  if (!hydrated || authLoading) return <div className="wrap" style={{ padding: 40 }}><div className="sk" style={{ height: 200 }} /></div>;

  // Checkout needs an account for the order history and delivery updates, so ask
  // up front rather than letting someone fill the whole form and fail at the end.
  if (!user) {
    return (
      <>
        <div className="wrap" style={{ padding: "40px 0" }}>
          <div className="v5empty" style={{ maxWidth: 480, margin: "0 auto" }}>
            <IconUser />
            <h3 className="t-h3">Sign in to check out</h3>
            <p className="t-small">We&apos;ll send order updates to your mobile. Your cart is saved.</p>
            <button type="button" className="btn btn--rose btn--sm" onClick={() => setShowLoginModal(true)}>
              Sign in to continue
            </button>
            <Link className="t-small" href="/cart" style={{ marginTop: 12, display: "inline-block" }}>Back to cart</Link>
          </div>
        </div>
        <SiteFooter storeSlug={storeSlug} className="ftr--desktop" />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <div className="wrap" style={{ padding: "40px 0" }}>
          <div className="v5empty" style={{ maxWidth: 480, margin: "0 auto" }}>
            <IconPlus />
            <h3 className="t-h3">Nothing to check out</h3>
            <p className="t-small">Your cart is empty.</p>
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
        <Link href="/cart" className="v5ibtn cart5__back" aria-label="Back to cart"><IconChevL /></Link>
        <h1 className="t-h1">Delivery details</h1>
      </div>

      <div className="wrap">
        <div className="steps5">
          <div className="is-done"><i>✓</i> Cart</div><span className="bar" />
          <div className="is-on"><i>2</i> Delivery</div><span className="bar" />
          <div><i>3</i> Confirm</div>
        </div>
      </div>

      <div className="wrap co5">
        <div>
          {staleBasket ? (
            <div className="co5__stale">
              <b>Your basket was filled at a different outlet.</b>
              <p>You&apos;re now ordering from {outlet.name}, which bakes its own menu. Start a fresh basket to continue.</p>
              <button type="button" className="btn btn--rose btn--sm" onClick={() => { clearCart(); router.push("/"); }}>
                Empty basket &amp; browse {outlet.name}
              </button>
            </div>
          ) : null}

          <div className="opt-block">
            <h4>Deliver or pick up?</h4>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="chip" aria-pressed={orderType === "DELIVERY"} onClick={() => setOrderType("DELIVERY")}>Deliver to me</button>
              <button type="button" className="chip" aria-pressed={orderType === "PICKUP"} onClick={() => setOrderType("PICKUP")}>Pick up in store</button>
            </div>
          </div>

          {orderType === "DELIVERY" ? (
            <div className="opt-block">
              <h4>Delivery address</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {addresses.map((a) => {
                  const check = checks[a.id];
                  const blocked = check ? !check.deliverable : false;
                  return (
                    <button
                      type="button"
                      key={a.id}
                      className={`addr5${addrId === a.id && !newAddr ? " is-on" : ""}${blocked ? " is-off" : ""}`}
                      disabled={blocked}
                      onClick={() => { setAddrId(a.id); setNewAddr(false); }}
                    >
                      <input type="radio" readOnly checked={addrId === a.id && !newAddr} tabIndex={-1} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span className="addr5__tag">{a.label || "Address"}</span>
                          {addrId === a.id && !newAddr ? <span className="badge badge--save">Delivering here</span> : null}
                        </span>
                        <b style={{ fontSize: 14.5, display: "block", lineHeight: 1.35 }}>
                          {[a.houseNo, a.fullAddress].filter(Boolean).join(", ")}
                        </b>
                        <span className="t-small">{a.landmark ? `${a.landmark} · ` : ""}{a.pincode}</span>
                        {check ? (
                          <span className={`addr5__chk${blocked ? " is-bad" : ""}`}>
                            {blocked
                              ? check.reason
                              : `${check.distanceKm != null ? `${check.distanceKm.toFixed(1)} km · ` : ""}${check.fee > 0 ? `${formatPrice(check.fee)} delivery` : "Free delivery"}`}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}

                {!newAddr ? (
                  <button type="button" className="addr5 addr5__new" onClick={() => setNewAddr(true)}>
                    <IconPlus /> Add a new address
                  </button>
                ) : (
                  <div style={{ borderTop: addresses.length ? "1px dashed var(--line-2)" : "none", paddingTop: addresses.length ? 14 : 0 }}>
                    <AddressForm
                      fallbackCity={area.city}
                      fallbackPincodes={area.pincodes}
                      onCancel={() => setNewAddr(false)}
                      onSaved={(saved) => {
                        setAddresses((list) => [saved, ...list]);
                        setAddrId(saved.id);
                        setNewAddr(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="opt-block">
              <h4>Pick up from</h4>
              <div className="co5__pickup">
                <IconPin />
                <span>
                  <b>{outlet.name || area.city}</b>
                  {outlet.address ? <small>{outlet.address}</small> : null}
                  {outlet.phone ? <a href={`tel:+91${outlet.phone}`}>+91 {outlet.phone}</a> : null}
                </span>
              </div>
            </div>
          )}

          <div className="opt-block">
            <h4>When?</h4>
            <div className="dpick">
              {DAYS.map((d) => (
                <button type="button" key={d.iso} className="dpick__d" aria-pressed={date === d.iso} onClick={() => setDate(d.iso)}>
                  <em>{d.dow}</em>
                  <b>{d.day}</b>
                  <i>{d.mon}</i>
                </button>
              ))}
            </div>
            {slotOptions.length > 0 ? (
              <div className="slots">
                {slotOptions.map((s) => (
                  <button
                    type="button"
                    key={s.label}
                    className="chip chip--sm"
                    aria-pressed={slot === s.label}
                    onClick={() => setSlot(s.label)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="t-small" style={{ marginTop: 12 }}>
                Today&apos;s slots have closed — pick another date above.
              </p>
            )}
          </div>

          <AddOnsPicker
            addOns={addOns}
            picked={picked}
            maxQty={slotCfg.maxQty}
            onChange={bump}
            onLimit={(name) => toast(`Up to ${slotCfg.maxQty} ${name} per order`, "error")}
          />

          <div className="opt-block">
            <h4>Anything we should know? <span className="t-small">optional</span></h4>
            <input className="input" placeholder="Gate code, floor, ring the bell twice…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <aside className="summary5">
          <h3 className="t-h3">Order summary</h3>
          {items.map((i) => (
            <div className="co5__item" key={`${i.productId}-${i.variantName}-${i.flavour}`}>
              {i.image ? (
                <Image src={img(i.image, 120, 120)} alt="" width={52} height={52} unoptimized />
              ) : (
                // keep the 3-column grid intact when a product has no photo
                <span className="order5__noimg" aria-hidden="true"><IconCake /></span>
              )}
              <div style={{ minWidth: 0 }}>
                <b>{i.name}</b>
                <span className="t-small">{[i.variantName, i.flavour].filter(Boolean).join(" · ")}{i.quantity > 1 ? ` × ${i.quantity}` : ""}</span>
              </div>
              <b className="t-num">{formatPrice(i.unitPrice * i.quantity)}</b>
            </div>
          ))}
          <div className="sline"><span>Item total</span><b>{formatPrice(subtotal)}</b></div>
          {addOnTotal > 0 ? <div className="sline"><span>Add-ons</span><b>{formatPrice(addOnTotal)}</b></div> : null}
          <div className="sline"><span>Safe cake packaging</span><b>{formatPrice(charges.packaging)}</b></div>
          <div className="sline"><span>Delivery</span><b>{delivery ? formatPrice(delivery) : "Free"}</b></div>
          {discount > 0 ? (
            <div className="sline sline--save"><span>{activePromo?.code}</span><b>−{formatPrice(discount)}</b></div>
          ) : null}
          {charges.gstRate > 0 ? (
            <div className="sline"><span>GST ({charges.gstRate}%)</span><b>{formatPrice(gst)}</b></div>
          ) : null}

          <div className="promo">
            {activePromo ? (
              <div className="promo__on">
                <span className="promo__tag">{activePromo.code}</span>
                <span className="t-small">You save {formatPrice(discount)}</span>
                <button type="button" onClick={() => setPromo(null)}>Remove</button>
              </div>
            ) : (
              <>
                <div className="promo__row">
                  <input
                    className="input"
                    placeholder="Promo code"
                    value={promoInput}
                    autoCapitalize="characters"
                    onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoErr(""); }}
                    onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                  />
                  <button type="button" className="btn btn--out btn--sm" disabled={promoBusy || !promoInput.trim()} onClick={() => applyPromo()}>
                    {promoBusy ? "…" : "Apply"}
                  </button>
                </div>
                {promoErr ? <p className="promo__err">{promoErr}</p> : null}
                {offers.length > 0 ? (
                  <div className="promo__chips">
                    {offers.map((o) => (
                      <button type="button" key={o.code} onClick={() => applyPromo(o.code)}>{o.code}</button>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="sline sline--tot"><span>To pay</span><b>{formatPrice(total)}</b></div>
          {shortBy > 0 ? (
            <p className="co5__min">Add {formatPrice(shortBy)} more to meet the {formatPrice(charges.minOrder)} delivery minimum.</p>
          ) : null}
          <button type="button" className="btn btn--rose btn--block btn--lg summary5__cta" style={{ marginTop: 16 }} disabled={placing} onClick={placeOrder}>
            {placing ? "Placing…" : "Place order"}
          </button>
          <p className="t-small" style={{ textAlign: "center", marginTop: 10 }}>
            You&apos;ll choose how to pay once we confirm the order.
          </p>
        </aside>
      </div>

      <div className="msticky">
        <div>
          <div className="t-small" style={{ fontSize: 11, lineHeight: 1.2 }}>Total</div>
          <b className="t-num" style={{ fontFamily: "var(--font-jakarta)", fontSize: 19, fontWeight: 800, letterSpacing: "-.03em" }}>{formatPrice(total)}</b>
        </div>
        <button type="button" className="btn btn--rose" style={{ flex: 1, height: 48 }} disabled={placing} onClick={placeOrder}>
          {placing ? "Placing…" : "Place order"}
        </button>
      </div>

      <SiteFooter storeSlug={storeSlug} className="ftr--desktop" />
    </>
  );
}
