/** Delivery slot configuration shared by the admin editor, the store config API and checkout. */

export type DeliverySlot = {
  /** Customer-facing text, e.g. "10am - 1pm". */
  label: string;
  /** Slot opening time, "HH:MM" 24h. Used for same-day cut-off. */
  start: string;
  /** Slot closing time, "HH:MM" 24h. */
  end: string;
  active: boolean;
};

export const DEFAULT_SLOTS: DeliverySlot[] = [
  { label: "10am - 1pm", start: "10:00", end: "13:00", active: true },
  { label: "1pm - 4pm", start: "13:00", end: "16:00", active: true },
  { label: "4pm - 7pm", start: "16:00", end: "19:00", active: true },
  { label: "7pm - 10pm", start: "19:00", end: "22:00", active: true },
];

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Minutes past midnight, or null when the value is not a valid "HH:MM". */
export function minutesOf(hhmm: string): number | null {
  const m = HHMM.exec(hhmm ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/**
 * Coerce whatever is stored on the store row into usable slots.
 * Accepts the current object form and the legacy plain-string array,
 * and falls back to the defaults so checkout can never end up slot-less.
 */
export function parseSlots(raw: unknown): DeliverySlot[] {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return DEFAULT_SLOTS;
    }
  }
  if (!Array.isArray(value)) return DEFAULT_SLOTS;

  const slots = value.flatMap((entry): DeliverySlot[] => {
    if (typeof entry === "string") {
      const label = entry.trim();
      return label ? [{ label, start: "00:00", end: "23:59", active: true }] : [];
    }
    if (!entry || typeof entry !== "object") return [];
    const e = entry as Record<string, unknown>;
    const label = typeof e.label === "string" ? e.label.trim() : "";
    if (!label) return [];
    const start = typeof e.start === "string" && HHMM.test(e.start) ? e.start : "00:00";
    const end = typeof e.end === "string" && HHMM.test(e.end) ? e.end : "23:59";
    return [{ label, start, end, active: e.active !== false }];
  });

  return slots.length ? slots : DEFAULT_SLOTS;
}

/**
 * Slots a customer may still pick for `dateIso` (local "YYYY-MM-DD"),
 * honouring the store's preparation lead time on same-day orders.
 */
export function slotsForDate(
  slots: DeliverySlot[],
  dateIso: string,
  leadHours: number,
  now: Date = new Date(),
): DeliverySlot[] {
  const live = slots.filter((s) => s.active);
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (dateIso !== todayIso) return live;

  const earliest = now.getHours() * 60 + now.getMinutes() + Math.max(0, leadHours) * 60;
  return live.filter((s) => {
    const start = minutesOf(s.start);
    return start === null || start >= earliest;
  });
}
