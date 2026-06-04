"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

interface Props {
  images: string[];
  alt: string;
  sizes?: string;
  children?: React.ReactNode;
}

export function HoverImageCycler({ images, alt, sizes = "(max-width:640px) 50vw, 25vw", children }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swiping = useRef(false);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  }, []);

  // Desktop: hover + pause (600ms dwell) then start cycling
  const handleMouseEnter = useCallback(() => {
    if (images.length <= 1) return;
    delayRef.current = setTimeout(() => {
      setActiveIdx(1);
      if (images.length <= 2) return;
      let idx = 1;
      intervalRef.current = setInterval(() => {
        idx = (idx + 1) % images.length;
        setActiveIdx(idx);
      }, 1200);
    }, 600);
  }, [images.length]);

  const handleMouseLeave = useCallback(() => {
    if (delayRef.current) { clearTimeout(delayRef.current); delayRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setActiveIdx(0);
  }, []);

  // Mobile: swipe to navigate
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (images.length <= 1) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    // Only count as swipe if horizontal movement > vertical (prevents blocking scroll)
    if (dx > 15 && dx > dy * 1.5) {
      swiping.current = true;
      e.stopPropagation();
    }
  }, [images.length]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (images.length <= 1 || !swiping.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 30) {
      e.preventDefault();
      e.stopPropagation();
      if (diff > 0) {
        // Swipe left → next
        setActiveIdx((prev) => (prev + 1) % images.length);
      } else {
        // Swipe right → previous
        setActiveIdx((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    swiping.current = false;
  }, [images.length]);

  // Tap on dot to go to that image
  const goToImage = useCallback((idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx(idx);
  }, []);

  if (!images[0]) return null;

  return (
    <div
      className="w-full h-full relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {images.map((img, idx) => (
        <Image
          key={img}
          src={img}
          alt={idx === 0 ? alt : `${alt} view ${idx + 1}`}
          fill
          quality={90}
          className={`object-cover transition-opacity duration-300 ${idx === activeIdx ? "opacity-100" : "opacity-0"}`}
          sizes={sizes}
          loading={idx === 0 ? undefined : "lazy"}
        />
      ))}
      {/* Dot indicators — tappable */}
      {images.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => goToImage(idx, e)}
              className={`rounded-full transition-all ${idx === activeIdx ? "bg-white w-3 h-1.5" : "bg-white/50 w-1.5 h-1.5"}`}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
