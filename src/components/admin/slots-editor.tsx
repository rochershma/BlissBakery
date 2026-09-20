"use client";

import { useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
import type { DeliverySlot } from "@/lib/slots";

let seq = 0;
const nextKey = () => `slot-${seq++}`;

/**
 * Repeatable editor for the store's delivery slots. Rows are serialised into a
 * single hidden field so the parent server action stays a plain form submit.
 */
export function SlotsEditor({ slots }: { slots: DeliverySlot[] }) {
  const [rows, setRows] = useState(() => slots.map((s) => ({ ...s, key: nextKey() })));

  const patch = (key: string, next: Partial<DeliverySlot>) =>
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...next } : row)));

  const add = () =>
    setRows((r) => [...r, { key: nextKey(), label: "", start: "09:00", end: "12:00", active: true }]);

  const remove = (key: string) => setRows((r) => r.filter((row) => row.key !== key));

  const payload = rows
    .filter((r) => r.label.trim())
    .map(({ label, start, end, active }) => ({ label: label.trim(), start, end, active }));

  return (
    <div className="bg-white rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="label-premium text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Delivery Slots
        </h2>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Add slot
        </button>
      </div>

      <input type="hidden" name="deliverySlots" value={JSON.stringify(payload)} />

      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No slots yet — customers will see the default time windows.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>Label shown to customer</span>
            <span>From</span>
            <span>To</span>
            <span>Active</span>
            <span />
          </div>
          {rows.map((row) => (
            <div key={row.key} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
              <input
                value={row.label}
                onChange={(e) => patch(row.key, { label: e.target.value })}
                placeholder="10am - 1pm"
                maxLength={40}
                className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="time"
                value={row.start}
                onChange={(e) => patch(row.key, { start: e.target.value })}
                className="px-2 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="time"
                value={row.end}
                onChange={(e) => patch(row.key, { end: e.target.value })}
                className="px-2 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="checkbox"
                checked={row.active}
                onChange={(e) => patch(row.key, { active: e.target.checked })}
                aria-label={`${row.label || "Slot"} active`}
                className="w-4 h-4 accent-primary justify-self-center"
              />
              <button
                type="button"
                onClick={() => remove(row.key)}
                aria-label={`Remove ${row.label || "slot"}`}
                className="p-2 text-muted-foreground hover:text-danger"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        Slots starting within the preparation lead time are hidden for same-day orders.
      </p>
    </div>
  );
}
