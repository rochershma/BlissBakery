"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { img } from "@/lib/img";

export type AddOn = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
};

/** How many add-ons the inline rail shows before falling back to the sheet. */
const RAIL_LIMIT = 6;

function Stepper({
  qty,
  max,
  onAdd,
  onSub,
  name,
}: {
  qty: number;
  max: number;
  onAdd: () => void;
  onSub: () => void;
  name: string;
}) {
  if (qty === 0) {
    return (
      <button type="button" className="ao__add" onClick={onAdd}>
        Add
      </button>
    );
  }
  return (
    <span className="ao__step">
      <button type="button" onClick={onSub} aria-label={`Remove one ${name}`}>
        −
      </button>
      <b aria-live="polite">{qty}</b>
      <button type="button" onClick={onAdd} disabled={qty >= max} aria-label={`Add one ${name}`}>
        +
      </button>
    </span>
  );
}

export function AddOnsPicker({
  addOns,
  picked,
  maxQty,
  onChange,
  onLimit,
}: {
  addOns: AddOn[];
  picked: Record<string, number>;
  maxQty: number;
  onChange: (id: string, qty: number) => void;
  onLimit?: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const bump = (a: AddOn, delta: 1 | -1) => {
    const current = picked[a.id] ?? 0;
    const next = current + delta;
    if (next > maxQty) {
      onLimit?.(a.name);
      return;
    }
    onChange(a.id, Math.max(0, next));
  };

  const totalPicked = useMemo(
    () => Object.values(picked).reduce((s, q) => s + q, 0),
    [picked],
  );
  const pickedValue = useMemo(
    () =>
      Object.entries(picked).reduce(
        (s, [id, q]) => s + (addOns.find((a) => a.id === id)?.price ?? 0) * q,
        0,
      ),
    [picked, addOns],
  );

  // Anything already chosen stays visible on the rail so the selection never
  // hides behind the "more" button.
  const rail = useMemo(() => {
    const chosen = addOns.filter((a) => picked[a.id]);
    const rest = addOns.filter((a) => !picked[a.id]);
    return [...chosen, ...rest].slice(0, Math.max(RAIL_LIMIT, chosen.length));
  }, [addOns, picked]);

  const grouped = useMemo(() => {
    const map = new Map<string, AddOn[]>();
    for (const a of addOns) {
      const key = a.category?.trim() || "Extras";
      const list = map.get(key);
      list ? list.push(a) : map.set(key, [a]);
    }
    return [...map.entries()];
  }, [addOns]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (addOns.length === 0) return null;

  return (
    <div className="opt-block">
      <div className="ao__head">
        <h4>
          Add to the box{" "}
          <span className="t-small">optional · added once to your order</span>
        </h4>
        {addOns.length > rail.length ? (
          <button type="button" className="ao__all" onClick={() => setOpen(true)}>
            See all {addOns.length}
          </button>
        ) : null}
      </div>

      <div className="aorail">
        {rail.map((a) => {
          const q = picked[a.id] ?? 0;
          return (
            <div className={`aocard${q ? " is-on" : ""}`} key={a.id}>
              <span className="aocard__img">
                {a.image ? (
                  <Image src={img(a.image, 160, 160)} alt="" width={160} height={160} unoptimized loading="lazy" />
                ) : (
                  <span className="tile__ph" />
                )}
              </span>
              <b className="aocard__n">{a.name}</b>
              <em className="aocard__p">{formatPrice(a.price)}</em>
              <Stepper
                qty={q}
                max={maxQty}
                name={a.name}
                onAdd={() => bump(a, 1)}
                onSub={() => bump(a, -1)}
              />
            </div>
          );
        })}
      </div>

      {totalPicked > 0 ? (
        <p className="ao__sum">
          <span>
            {totalPicked} add-on{totalPicked > 1 ? "s" : ""} · {formatPrice(pickedValue)}
          </span>
          <button type="button" onClick={() => Object.keys(picked).forEach((id) => onChange(id, 0))}>
            Clear
          </button>
        </p>
      ) : null}

      {open ? (
        <div className="aosheet" role="dialog" aria-modal="true" aria-label="All add-ons">
          <div className="aosheet__bg" onClick={() => setOpen(false)} />
          <div className="aosheet__panel">
            <div className="aosheet__top">
              <b>Add to the box</b>
              <button type="button" ref={closeRef} onClick={() => setOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="aosheet__body">
              {grouped.map(([cat, list]) => (
                <section key={cat}>
                  <h5 className="aosheet__cat">{cat}</h5>
                  {list.map((a) => {
                    const q = picked[a.id] ?? 0;
                    return (
                      <div className={`aorow${q ? " is-on" : ""}`} key={a.id}>
                        <span className="aorow__img">
                          {a.image ? (
                            <Image src={img(a.image, 120, 120)} alt="" width={120} height={120} unoptimized loading="lazy" />
                          ) : (
                            <span className="tile__ph" />
                          )}
                        </span>
                        <span className="aorow__t">
                          <b>{a.name}</b>
                          <em>{formatPrice(a.price)}</em>
                        </span>
                        <Stepper
                          qty={q}
                          max={maxQty}
                          name={a.name}
                          onAdd={() => bump(a, 1)}
                          onSub={() => bump(a, -1)}
                        />
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>
            <div className="aosheet__foot">
              <span>
                {totalPicked > 0 ? `${totalPicked} selected · ${formatPrice(pickedValue)}` : "Nothing selected"}
              </span>
              <button type="button" className="btn btn--rose" onClick={() => setOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
