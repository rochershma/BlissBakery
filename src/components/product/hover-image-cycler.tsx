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

  // Cleanup interval on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (images.length <= 1) return;
    // Immediately show next image
    setActiveIdx(1);
    if (images.length <= 2) return;
    // Cycle through remaining images every 1.2s
    let idx = 1;
    intervalRef.current = setInterval(() => {
      idx = (idx + 1) % images.length;
      setActiveIdx(idx);
    }, 1200);
  }, [images.length]);

  const handleMouseLeave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setActiveIdx(0);
  }, []);

  if (!images[0]) return null;

  return (
    <div
      className="w-full h-full relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={`w-1 h-1 rounded-full transition-all ${idx === activeIdx ? "bg-white w-2.5" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
