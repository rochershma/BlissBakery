"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { imgFit } from "@/lib/img";
import { IconChevL, IconChevR } from "./icons";

export type Slide = {
  id: string;
  image: string;
  mobileImage?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string | null;
  href?: string | null;
};

/**
 * Banner slider. Uploaded artwork often already carries its own headline,
 * so overlay copy renders only when the banner actually has a title.
 */
export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;

  const go = useCallback((next: number) => setI(((next % n) + n) % n), [n]);

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), 5500);
    return () => clearInterval(t);
  }, [paused, n]);

  if (!n) return null;

  return (
    <div
      className="v5-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="v5-slider__track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, k) => {
          const inner = (
            <>
              <picture>
                {s.mobileImage ? (
                  <source media="(max-width: 767px)" srcSet={imgFit(s.mobileImage, 800)} />
                ) : null}
                <Image
                  src={imgFit(s.image, 1600)}
                  alt={s.title ?? "Bliss Bakery"}
                  width={1600}
                  height={748}
                  priority={k === 0}
                  unoptimized
                />
              </picture>
              {s.title ? (
                <div className="v5-slide__cap">
                  <h2>{s.title}</h2>
                  {s.subtitle ? <p>{s.subtitle}</p> : null}
                  {s.ctaText ? <span className="btn btn--rose">{s.ctaText}</span> : null}
                </div>
              ) : null}
            </>
          );
          return (
            <div className="v5-slide" key={s.id}>
              {s.href ? <Link href={s.href} aria-label={s.title ?? "Shop"}>{inner}</Link> : inner}
            </div>
          );
        })}
      </div>

      {n > 1 && (
        <>
          <button type="button" className="v5-slider__nav v5-slider__nav--l" onClick={() => go(i - 1)} aria-label="Previous slide"><IconChevL /></button>
          <button type="button" className="v5-slider__nav v5-slider__nav--r" onClick={() => go(i + 1)} aria-label="Next slide"><IconChevR /></button>
          <div className="v5-slider__dots">
            {slides.map((s, k) => (
              <button
                key={s.id}
                type="button"
                className={k === i ? "is-on" : ""}
                onClick={() => go(k)}
                aria-label={`Go to slide ${k + 1}`}
                aria-current={k === i}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
