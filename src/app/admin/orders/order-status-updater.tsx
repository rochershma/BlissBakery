"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";

const statuses = ["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "PICKED_UP", "CANCELLED"] as const;

const statusLabels: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-800 border-blue-200" },
  PREPARING: { label: "Preparing", color: "bg-orange-100 text-orange-800 border-orange-200" },
  READY: { label: "Ready", color: "bg-green-100 text-green-800 border-green-200" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-purple-100 text-purple-800 border-purple-200" },
  DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PICKED_UP: { label: "Picked Up", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200" },
};

export function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(newStatus: string, notify: boolean) {
    setUpdating(newStatus);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notifyCustomer: notify }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert(data.message || "Failed to update");
      }
    } catch {
      alert("Error updating status");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <h3 className="label-premium text-foreground mb-3">Update Status</h3>
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => {
          const info = statusLabels[s];
          const isCurrent = currentStatus === s;
          return (
            <div key={s} className="flex items-center gap-1">
              <button
                onClick={() => updateStatus(s, false)}
                disabled={isCurrent || updating !== null}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isCurrent ? `${info.color} cursor-default` : "bg-white border-border text-muted-foreground hover:border-primary/50 cursor-pointer"
                } ${updating === s ? "opacity-50" : ""}`}
              >
                {updating === s ? "..." : info.label}
              </button>
              {!isCurrent && (
                <button
                  onClick={() => updateStatus(s, true)}
                  disabled={updating !== null}
                  title={`Set ${info.label} & notify customer on WhatsApp`}
                  className="p-1.5 rounded-lg border border-border text-green-600 hover:bg-green-50 hover:border-green-200 transition-colors"
                >
                  <Bell className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Click status to update. Click 🔔 to update + notify customer on WhatsApp.
      </p>
    </div>
  );
}
