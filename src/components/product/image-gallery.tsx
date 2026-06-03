"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageLightbox } from "./image-lightbox";

interface Props {
  images: string[];
  name: string;
  isBestseller?: boolean;
}

export function ProductImageGallery({ images, name, isBestseller }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swiping = useRef(false);

  const goNext = useCallback(() => setActiveIdx((i) => (i + 1) % images.length), [images.length]);
  const goPrev = useCallback(() => setActiveIdx((i) => (i - 1 + images.length) % images.length), [images.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (images.length <= 1) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > 15 && dx > dy * 1.5) swiping.current = true;
  }, [images.length]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (images.length <= 1 || !swiping.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? goNext() : goPrev();
    }
    swiping.current = false;
  }, [images.length, goNext, goPrev]);

  // Double tap for lightbox
  const lastTap = useRef(0);
  const handleTap = useCallback(() => {
    if (swiping.current) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setShowLightbox(true);
    }
    lastTap.current = now;
  }, []);

  return (
    <div className="space-y-2">
      {/* Main Image — swipeable */}
      <div
        className="relative aspect-square rounded-xl overflow-hidden bg-muted"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        {images.map((img, idx) => (
          <Image
            key={img}
            src={img}
            alt={idx === 0 ? name : `${name} view ${idx + 1}`}
            fill
            quality={90}
            className={`object-cover transition-opacity duration-300 ${idx === activeIdx ? "opacity-100" : "opacity-0"}`}
            sizes="(max-width:768px) 100vw,40vw"
            priority={idx === 0}
          />
        ))}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 z-10">
          <span className="bg-white/90 backdrop-blur-sm text-[9px] font-medium text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Leaf className="w-2.5 h-2.5" />100% Eggless
          </span>
          {isBestseller && (
            <span className="bg-primary text-primary-foreground text-[9px] font-medium px-1.5 py-0.5 rounded-full">
              ★ Best
            </span>
          )}
        </div>

        {/* Arrow nav — desktop */}
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm items-center justify-center hover:bg-white transition-colors shadow-sm z-10">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm items-center justify-center hover:bg-white transition-colors shadow-sm z-10">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setActiveIdx(idx); }}
                className={`rounded-full transition-all ${idx === activeIdx ? "bg-white w-4 h-1.5" : "bg-white/50 w-1.5 h-1.5"}`}
              />
            ))}
          </div>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <span className="absolute top-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full z-10">
            {activeIdx + 1}/{images.length}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`relative w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                idx === activeIdx
                  ? "border-primary ring-1 ring-primary/30"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={img} alt={`${name} view ${idx + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox — opens on double-tap or desktop click */}
      {showLightbox && (
        <ImageLightbox
          images={images}
          name={name}
          startIndex={activeIdx}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
}
