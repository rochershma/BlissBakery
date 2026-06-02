"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface Props {
  images: string[];
  name: string;
  startIndex?: number;
  onClose: () => void;
}

export function ImageLightbox({ images, name, startIndex = 0, onClose }: Props) {
  const [activeIdx, setActiveIdx] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastTouch = useRef({ x: 0, y: 0 });
  const initialDistance = useRef(0);

  const goNext = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setActiveIdx((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setActiveIdx((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  // Swipe detection
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
    }
    if (e.touches.length === 2) {
      initialDistance.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Pinch to zoom
    if (e.touches.length === 2 && initialDistance.current > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.min(Math.max(scale * (dist / initialDistance.current), 1), 4);
      setScale(newScale);
      initialDistance.current = dist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (initialDistance.current > 0) {
      initialDistance.current = 0;
      if (scale <= 1.1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
      return;
    }
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60 && scale <= 1.1) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  // Double tap to zoom
  const lastTap = useRef(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (scale > 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2.5);
      }
    }
    lastTap.current = now;
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium">{activeIdx + 1} / {images.length}</span>
        <span className="text-sm font-medium truncate mx-4 opacity-70">{name}</span>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Area */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleDoubleTap}
      >
        <div
          className="relative w-full h-full transition-transform duration-200"
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          }}
        >
          <Image
            src={images[activeIdx]}
            alt={`${name} - ${activeIdx + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            quality={95}
            priority
          />
        </div>

        {/* Navigation arrows — desktop */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Zoom hint */}
        {scale <= 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/70 text-xs px-3 py-1.5 rounded-full md:hidden">
            <ZoomIn className="w-3 h-3" />
            Double-tap to zoom · Swipe to navigate
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 justify-center px-4 py-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => { setActiveIdx(idx); setScale(1); setPosition({ x: 0, y: 0 }); }}
              className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                idx === activeIdx ? "border-white ring-1 ring-white/50" : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="48px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
