"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  productImage?: string | null;
}

const fallbackImages: Record<string, string> = {
  cakes: "/images/categories/cakes.jpg",
  pastries: "/images/categories/pastries.jpg",
  brownies: "/images/categories/brownies.jpg",
  "cookies-biscuits": "/images/categories/cookies.jpg",
  breads: "/images/categories/breads.jpg",
  combos: "/images/categories/combos.jpg",
  beverages: "/images/categories/beverages.jpg",
  "designer-cakes": "/images/categories/designer-cakes.jpg",
  "occasion-cakes": "/images/categories/occasion-cakes.jpg",
};

export function CategoryCircles({ categories, storeSlug }: { categories: Category[]; storeSlug: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("a")?.offsetWidth || 200;
    const amount = dir === "left" ? -(cardWidth + 16) : cardWidth + 16;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => { el.removeEventListener("scroll", checkScroll); };
  }, [checkScroll]);

  return (
    <section className="mt-8 md:mt-10">
      <div className="max-w-[1400px] mx-auto px-4 md:px-5">
        <div className="flex items-end justify-between gap-6 mb-5">
          <div>
            <p className="section-kicker">Explore Our Menu</p>
            <h2 className="text-[clamp(24px,3.5vw,38px)] font-serif font-bold leading-[0.98] tracking-[-0.055em]">Browse by category.</h2>
          </div>
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

        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1"
            style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory" }}
          >
            {categories.map((cat) => {
              const img = cat.image || cat.productImage || fallbackImages[cat.slug] || "/images/categories/cakes.jpg";
              return (
                <Link
                  key={cat.id}
                  href={`/store/${storeSlug}/menu?category=${cat.slug}`}
                  prefetch={false}
                  className="cat-card-premium flex-shrink-0 block"
                >
                  <Image
                    src={img}
                    alt={cat.name}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                  <span className="absolute left-3 right-3 bottom-3 z-[2] text-white font-serif text-base font-bold leading-[1.05] tracking-[-0.04em]"
                    style={{ textShadow: "0 5px 16px rgba(42,31,34,0.4)" }}
                  >
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
