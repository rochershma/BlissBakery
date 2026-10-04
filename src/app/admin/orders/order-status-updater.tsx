"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

const statusLabels: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-800 border-blue-200" },
  PREPARING: { label: "Preparing", color: "bg-orange-100 text-orange-800 border-orange-200" },
  READY: { label: "Ready", color: "bg-green-100 text-green-800 border-green-200" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-purple-100 text-purple-800 border-purple-200" },
  DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PICKED_UP: { label: "Picked Up", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200" },
};

const DELIVERY = ["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
const PICKUP = ["CONFIRMED", "PREPARING", "READY", "PICKED_UP", "CANCELLED"];

function customerMessage(status: string, orderNumber: string, store: string, pickup: boolean): string {
  const msgs: Record<string, string> = {
    CONFIRMED: `Hi! Your ${store} order ${orderNumber} is confirmed. We'll start baking soon.`,
    PREPARING: `Your ${store} order ${orderNumber} is being baked and decorated now.`,
    READY: pickup
      ? `Your ${store} order ${orderNumber} is ready to collect. See you soon!`
      : `Your ${store} order ${orderNumber} is ready and will leave shortly.`,
    OUT_FOR_DELIVERY: `Your ${store} order ${orderNumber} is out for delivery.`,
    DELIVERED: `Your ${store} order ${orderNumber} has been delivered. Enjoy!`,
    PICKED_UP: `Thanks for collecting ${orderNumber} from ${store}. Enjoy!`,
    CANCELLED: `Your ${store} order ${orderNumber} has been cancelled. Please reply if you have any questions.`,
  };
  return msgs[status] ?? `Update on your ${store} order ${orderNumber}: ${status}`;
}

export function OrderStatusUpdater({
  orderId,
  currentStatus,
  orderType = "DELIVERY",
  paymentStatus = "PENDING",
  orderNumber = "",
  customerPhone = "",
  storeName = "Bliss Bakery",
}: {
  orderId: string;
  currentStatus: string;
  orderType?: string;
  paymentStatus?: string;
  orderNumber?: string;
  customerPhone?: string;
  storeName?: string;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const pickup = orderType === "PICKUP";
  const statuses = pickup ? PICKUP : DELIVERY;

  async function update(body: Record<string, unknown>, key: string) {
    setUpdating(key);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Failed to update");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      alert("Error updating order");
      return false;
    } finally {
      setUpdating(null);
    }
  }

  async function setStatus(s: string, notify: boolean) {
    if (s === "CANCELLED" && !confirm("Cancel this order?")) return;
    // Open the chat synchronously so the popup isn't blocked, then fill it in.
    const win = notify && customerPhone ? window.open("about:blank", "_blank") : null;
    // Only record the customer as notified if the WhatsApp window actually opened,
    // so the order never claims a message was sent when the popup was blocked.
    const notified = Boolean(win);
    const ok = await update({ status: s, notifyCustomer: notified, expectedStatus: currentStatus }, s);
    if (win) {
      if (ok) {
        const text = encodeURIComponent(customerMessage(s, orderNumber, storeName, pickup));
        win.location.href = `https://wa.me/91${customerPhone}?text=${text}`;
      } else {
        win.close();
      }
    }
  }

  const paid = paymentStatus === "PAID";

  return (
    <div>
      <h3 className="label-premium text-foreground mb-3">Update Status</h3>
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => {
          const info = statusLabels[s];
          const isCurrent = currentStatus === s;
          const label = pickup && s === "READY" ? "Ready for pickup" : info.label;
          return (
            <div key={s} className="flex items-center gap-1">
              <button
                onClick={() => setStatus(s, false)}
                disabled={isCurrent || updating !== null}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isCurrent ? `${info.color} cursor-default` : "bg-white border-border text-muted-foreground hover:border-primary/50 cursor-pointer"
                } ${updating === s ? "opacity-50" : ""}`}
              >
                {updating === s ? "..." : label}
              </button>
              {!isCurrent && customerPhone ? (
                <button
                  onClick={() => setStatus(s, true)}
                  disabled={updating !== null}
                  title={`Set ${label} and message the customer on WhatsApp`}
                  aria-label={`Set ${label} and message the customer on WhatsApp`}
                  className="p-1.5 rounded-lg border border-border text-green-600 hover:bg-green-50 hover:border-green-200 transition-colors"
                >
                  <MessageCircle className="w-3 h-3" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Tap a status to update it. The green chat button also opens WhatsApp with a ready-made message for the customer.
      </p>

      <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Payment:</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${paid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
          {paid ? "Paid" : "Not paid yet"}
        </span>
        <button
          onClick={() => update({ paymentStatus: paid ? "PENDING" : "PAID" }, "pay")}
          disabled={updating !== null}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-white hover:border-primary/50"
        >
          {updating === "pay" ? "..." : paid ? "Mark as unpaid" : `Mark as paid (${pickup ? "at counter" : "on delivery"})`}
        </button>
      </div>
    </div>
  );
}
