"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";

interface OccasionItem {
  name: string;
  slug: string;
  image: string;
}

export function OccasionCarousel({ occasions }: { occasions: OccasionItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("a")?.offsetWidth || 160;
    const amount = dir === "left" ? -(cardWidth + 16) : cardWidth + 16;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  // Auto-slide every 1.8s
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const startAutoSlide = () => {
      intervalRef.current = setInterval(() => {
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scroll("right");
        }
      }, 1800);
    };

    startAutoSlide();

    const pause = () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    const resume = () => { pause(); startAutoSlide(); };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume);
    el.addEventListener("scroll", checkScroll, { passive: true });

    checkScroll();

    return () => {
      pause();
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
      el.removeEventListener("scroll", checkScroll);
    };
  }, [scroll, checkScroll]);

  return (
    <section className="mt-10 md:mt-14">
      <div className="max-w-[1200px] mx-auto px-4 md:px-5">
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <p className="section-kicker">For Every Celebration</p>
            <h2 className="text-[clamp(32px,4.8vw,56px)] font-serif font-bold leading-[0.98] tracking-[-0.055em]">Shop by occasion.</h2>
          </div>
          {/* Arrow controls — desktop */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-2xl border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-default bg-white shadow-sm"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-2xl border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-default bg-white shadow-sm"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 scroll-smooth"
            style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory" }}
          >
            {occasions.map((occ) => (
              <Link
                key={occ.slug}
                href={`/cakes/${occ.slug}`}
                className="occasion-card-premium flex-shrink-0 block"
              >
                <Image
                  src={occ.image}
                  alt={occ.name}
                  fill
                  className="object-cover"
                  sizes="210px"
                />
                <div className="absolute left-3 right-3 bottom-3 z-[1]">
                  <h4 className="font-serif font-bold text-lg text-white leading-[1] tracking-[-0.04em]">{occ.name}</h4>
                  <p className="mt-1 text-white/[0.78] text-[11px] font-bold">Explore collection</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
