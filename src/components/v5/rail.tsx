"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconChevL, IconChevR } from "./icons";

/**
 * Horizontal rail. Arrows render on desktop only, and only when there is
 * something to scroll to in that direction.
 */
export function Rail({
  children,
  itemWidth = 196,
  variant = "cards",
  className = "",
}: {
  children: React.ReactNode;
  itemWidth?: number;
  /** "tiles" collapses to a wrapping icon grid on phones. */
  variant?: "tiles" | "cards";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= max - 4);
  }, []);

  useEffect(() => {
    sync();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [sync, children]);

  const nudge = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className={`rail rail--${variant} ${className}`} style={{ "--rail-col": `${itemWidth}px` } as React.CSSProperties}>
      <button
        type="button"
        className="rail__nav rail__nav--l"
        hidden={atStart}
        aria-label="Scroll left"
        onClick={() => nudge(-1)}
      >
        <IconChevL />
      </button>
      <div
        ref={ref}
        className="rail__track"
        onScroll={sync}
      >
        {children}
      </div>
      <button
        type="button"
        className="rail__nav rail__nav--r"
        hidden={atEnd}
        aria-label="Scroll right"
        onClick={() => nudge(1)}
      >
        <IconChevR />
      </button>
    </div>
  );
}
