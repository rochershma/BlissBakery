"use client";

import { useEffect, useRef, useState } from "react";
import { IconChevD, IconCheck } from "./icons";

export type Option = { value: string; label: string; sub?: string };

/**
 * Brand-styled dropdown. A native <select> opens the OS picker (blue iOS wheel),
 * which can't be themed — this renders our own pink popover instead.
 */
export function SelectMenu({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className={`selmenu${open ? " is-open" : ""} ${className}`} ref={ref}>
      <button type="button" className="selmenu__btn" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen((v) => !v)}>
        <span className="selmenu__val">{current?.label}</span>
        <IconChevD className="selmenu__chev" />
      </button>
      {open ? (
        <ul className="selmenu__list" role="listbox" aria-label={ariaLabel}>
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button type="button" className={`selmenu__opt${o.value === value ? " is-on" : ""}`}
                onClick={() => { onChange(o.value); setOpen(false); }}>
                <span><b>{o.label}</b>{o.sub ? <small>{o.sub}</small> : null}</span>
                {o.value === value ? <IconCheck /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
