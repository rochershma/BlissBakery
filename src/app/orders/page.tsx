"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-provider";
import { AccountShell } from "@/components/v5/account-shell";
import { SiteFooter } from "@/components/v5/site-footer";
import { formatPrice } from "@/lib/utils";
import { img, firstImage } from "@/lib/img";
import { IconBag } from "@/components/v5/icons";

type OrderItem = { id: string; productName: string; variantName: string | null; flavour: string | null; quantity: number; totalPrice: number; cakeMessage: string | null; product?: { images: string | null; slug: string } | null };
type Order = { id: string; orderNumber: string; status: string; paymentStatus: string; grandTotal: number; createdAt: string; deliveryDate: string | null; deliverySlot: string | null; items: OrderItem[] };

const LABEL: Record<string, string> = {
  PENDING: "Order placed", CONFIRMED: "Confirmed", PREPARING: "Preparing",
  READY: "Ready", OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Delivered",
  PICKED_UP: "Picked up", CANCELLED: "Cancelled",
};

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  const { user, loading, setShowLoginModal } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!loading && !user) setShowLoginModal(true);
  }, [loading, user, setShowLoginModal]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d?.orders ?? []))
      .catch(() => setOrders([]));
  }, [user]);

  return (
    <>
      <AccountShell active="/orders">
        <h1 className="t-h1" style={{ marginBottom: 18 }}>Order history</h1>

        {!user ? (
          <div className="v5empty">
            <IconBag />
            <h3 className="t-h3">Sign in to see your orders</h3>
            <p className="t-small">We&apos;ll text you a one-time code — no password needed.</p>
            <button type="button" className="btn btn--rose btn--sm" onClick={() => setShowLoginModal(true)}>Sign in</button>
          </div>
        ) : orders === null ? (
          <>
            <div className="sk" style={{ height: 150, marginBottom: 14, borderRadius: 16 }} />
            <div className="sk" style={{ height: 150, borderRadius: 16 }} />
          </>
        ) : orders.length === 0 ? (
          <div className="v5empty">
            <IconBag />
            <h3 className="t-h3">No orders yet</h3>
            <p className="t-small">When you order a cake it&apos;ll show up here.</p>
            <Link className="btn btn--rose btn--sm" href="/store/kuchaman-city/menu">Browse cakes</Link>
          </div>
        ) : (
          orders.map((o) => (
            <div className="order5" key={o.id}>
              <div className="order5__hd">
                <span className={`status st-${o.status.toLowerCase()}`}><i />{LABEL[o.status] ?? o.status}</span>
                <span className="order5__num">{o.orderNumber}</span>
                <span className="t-small">
                  {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {o.deliverySlot ? ` · ${o.deliverySlot}` : ""}
                </span>
                <b className="t-num order5__total">{formatPrice(o.grandTotal)}</b>
              </div>

              <div className="order5__body">
                {o.items.map((it) => {
                  const src = firstImage(it.product?.images);
                  return (
                    <div className="order5__row" key={it.id}>
                      {src ? <Image src={img(src, 130, 130)} alt="" width={54} height={54} unoptimized /> : <div className="sk" style={{ width: 54, height: 54 }} />}
                      <div style={{ minWidth: 0 }}>
                        <b>{it.productName}</b>
                        <span className="t-small">
                          {[it.variantName, it.flavour].filter(Boolean).join(" · ")}
                          {it.quantity > 1 ? ` × ${it.quantity}` : ""}
                        </span>
                        {it.cakeMessage ? <span className="t-small">On the cake — “{it.cakeMessage}”</span> : null}
                      </div>
                      <b className="t-num">{formatPrice(it.totalPrice)}</b>
                    </div>
                  );
                })}
              </div>

              <div className="order5__ft">
                <span className="t-small">
                  {o.status === "DELIVERED" || o.status === "PICKED_UP"
                    ? "Completed"
                    : o.status === "CANCELLED"
                      ? "Cancelled"
                      : "We'll text you when it's out for delivery"}
                </span>
                <span style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                  <Link className="btn btn--rose btn--sm" href={`/order/${o.id}`}>Track order</Link>
                  {o.items[0]?.product?.slug ? (
                    <Link className="btn btn--out btn--sm" href={`/store/kuchaman-city/menu/${o.items[0].product.slug}`}>Reorder</Link>
                  ) : null}
                </span>
              </div>
            </div>
          ))
        )}
      </AccountShell>
      <SiteFooter />
    </>
  );
}
