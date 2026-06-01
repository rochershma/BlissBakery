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

  // Auto-slide every 3.5s
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
      }, 3500);
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
    <section className="py-6 md:py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-primary text-xs tracking-[0.2em] uppercase mb-0.5">For Every Celebration</p>
            <h3 className="text-xl md:text-2xl font-bold text-foreground font-serif">Shop by Occasion</h3>
          </div>
          {/* Arrow controls — desktop */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-default"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-default"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 scroll-smooth"
          >
            {occasions.map((occ) => (
              <Link
                key={occ.slug}
                href={`/cakes/${occ.slug}`}
                className="flex-shrink-0 w-[140px] md:w-[180px] group"
              >
                <div className="relative h-[180px] md:h-[220px] rounded-2xl overflow-hidden mb-2">
                  <Image
                    src={occ.image}
                    alt={occ.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="180px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <h4 className="font-serif font-bold text-sm text-white leading-tight">{occ.name}</h4>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {/* Mobile scroll hint */}
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none md:hidden" />
          )}
        </div>
      </div>
    </section>
  );
}
