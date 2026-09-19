import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import { img, firstImage } from "@/lib/img";
import { SiteHeaderV5 } from "@/components/v5/site-header";
import { SiteFooter } from "@/components/v5/site-footer";
import { navLinks } from "@/lib/nav";
import { IconChevL, IconCake } from "@/components/v5/icons";

export const dynamic = "force-dynamic";

const FLOW = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
const LABEL: Record<string, string> = {
  PENDING: "Order placed",
  CONFIRMED: "Confirmed by the bakery",
  PREPARING: "Baking & decorating",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  PICKED_UP: "Picked up",
  CANCELLED: "Cancelled",
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/orders");

  const [store, order] = await Promise.all([
    db.store.findFirst(),
    db.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { images: true, slug: true } } } },
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    }),
  ]);
  if (!store || !order) notFound();
  if (order.userId !== session.userId && session.role !== "ADMIN" && session.role !== "STAFF") notFound();

  const nav = await navLinks(store.slug);
  const cancelled = order.status === "CANCELLED";
  const reached = new Set(order.statusHistory.map((h) => h.status));
  const currentIdx = FLOW.indexOf(order.status as (typeof FLOW)[number]);

  const steps = cancelled
    ? [{ k: "CANCELLED", done: true, now: true }]
    : FLOW.map((k, i) => ({ k, done: reached.has(k) || i < currentIdx, now: k === order.status }));

  const when = order.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : null;

  return (
    <>
      <SiteHeaderV5 storeSlug={store.slug} logo={store.logo} nav={nav} pincode={store.pincode} />

      <div className="wrap cart5__head">
        <Link href="/orders" className="v5ibtn cart5__back" aria-label="Back to orders"><IconChevL /></Link>
        <div>
          <p className="t-small">{order.orderNumber}</p>
          <h1 className="t-h1">Track order</h1>
        </div>
      </div>

      <div className="wrap track5" style={{ paddingBottom: 40 }}>
        <div>
          <div className="track5__hero">
            <span className={`status st-${order.status.toLowerCase()}`}><i />{LABEL[order.status] ?? order.status}</span>
            <b>
              {cancelled
                ? "This order was cancelled"
                : order.status === "DELIVERED" || order.status === "PICKED_UP"
                  ? "Delivered — hope it was lovely"
                  : `Arriving ${when ?? "soon"}${order.deliverySlot ? `, ${order.deliverySlot}` : ""}`}
            </b>
            <p className="t-small" style={{ marginTop: 4 }}>
              {cancelled ? "If you were charged, the refund is on its way." : "We'll text you at each step."}
            </p>
          </div>

          <div className="opt-block" style={{ marginTop: 16 }}>
            {steps.map((s, k) => (
              <div className="tl5" key={s.k}>
                <div className="tl5__col">
                  <span
                    className="tl5__dot"
                    style={{
                      background: cancelled ? "var(--danger)" : s.done ? "var(--green)" : s.now ? "var(--rose)" : "#fff",
                      border: !s.done && !s.now ? "2px solid var(--line-2)" : undefined,
                      boxShadow: s.now && !s.done ? "0 0 0 4px var(--rose-100)" : undefined,
                    }}
                  />
                  {k < steps.length - 1 ? (
                    <span className="tl5__line" style={{ background: s.done ? "var(--green)" : "var(--line)" }} />
                  ) : null}
                </div>
                <div className="tl5__t" style={{ paddingBottom: k < steps.length - 1 ? 16 : 0 }}>
                  <b style={{ color: !s.done && !s.now ? "var(--ink-4)" : undefined }}>{LABEL[s.k]}</b>
                  <span>
                    {order.statusHistory.find((h) => h.status === s.k)
                      ? new Date(order.statusHistory.find((h) => h.status === s.k)!.createdAt).toLocaleString("en-IN", {
                          day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="summary5">
          <h3 className="t-h3" style={{ marginBottom: 12 }}>
            {order.items.length} {order.items.length === 1 ? "item" : "items"}
          </h3>
          {order.items.map((it) => {
            const src = firstImage(it.product?.images);
            const extras = parseJsonSafe<{ name: string; price: number }[]>(it.addOns, []);
            return (
              <div className="co5__item" key={it.id}>
                {src ? (
                  <Image src={img(src, 120, 120)} alt="" width={52} height={52} unoptimized />
                ) : (
                  // product deleted since ordering — static placeholder, not a skeleton
                  <span className="order5__noimg" aria-hidden="true"><IconCake /></span>
                )}
                <div style={{ minWidth: 0 }}>
                  <b>{it.productName}</b>
                  <span className="t-small">
                    {[it.variantName, it.flavour].filter(Boolean).join(" · ")}
                    {it.quantity > 1 ? ` × ${it.quantity}` : ""}
                  </span>
                  {extras.length ? <span className="t-small">{extras.map((e) => e.name).join(", ")}</span> : null}
                </div>
                <b className="t-num">{formatPrice(it.totalPrice)}</b>
              </div>
            );
          })}

          <div className="sline"><span>Item total</span><b>{formatPrice(order.itemTotal)}</b></div>
          {order.packagingCharge ? <div className="sline"><span>Packaging</span><b>{formatPrice(order.packagingCharge)}</b></div> : null}
          {order.deliveryCharge ? <div className="sline"><span>Delivery</span><b>{formatPrice(order.deliveryCharge)}</b></div> : null}
          {order.discount ? <div className="sline" style={{ color: "var(--green)" }}><span>Discount</span><b style={{ color: "var(--green)" }}>−{formatPrice(order.discount)}</b></div> : null}
          <div className="sline sline--tot"><span>{order.paymentStatus === "PAID" ? "Paid" : "To pay"}</span><b>{formatPrice(order.grandTotal)}</b></div>

          {order.deliveryAddress ? (
            <p className="t-small" style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
              <b style={{ color: "var(--ink)" }}>Delivering to</b><br />{order.deliveryAddress}
            </p>
          ) : null}

          <a className="btn btn--out btn--block" style={{ marginTop: 14 }} href={`https://wa.me/91${store.phone}?text=Hi, I need help with order ${order.orderNumber}`} target="_blank" rel="noopener noreferrer">
            Need help with this order?
          </a>
        </aside>
      </div>

      <SiteFooter storeSlug={store.slug} phone={store.phone} logo={store.logo} className="ftr--desktop" />
    </>
  );
}
