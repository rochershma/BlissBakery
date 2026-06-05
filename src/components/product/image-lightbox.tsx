"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
  name: string;
  startIndex?: number;
  onClose: () => void;
}

export function ImageLightbox({ images, name, startIndex = 0, onClose }: Props) {
  const [activeIdx, setActiveIdx] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Pinch zoom state
  const pinchStart = useRef(0);
  const pinchScale = useRef(1);
  const panStart = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);

  // Swipe state
  const swipeStartX = useRef(0);
  const swipeDelta = useRef(0);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    pinchScale.current = 1;
  }, []);

  const goNext = useCallback(() => { resetZoom(); setActiveIdx((i) => (i + 1) % images.length); }, [images.length, resetZoom]);
  const goPrev = useCallback(() => { resetZoom(); setActiveIdx((i) => (i - 1 + images.length) % images.length); }, [images.length, resetZoom]);

  // Lock body scroll + keyboard
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handleKey); };
  }, [onClose, goNext, goPrev]);

  // Touch: pinch-to-zoom + swipe + pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStart.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchScale.current = scale;
    } else if (e.touches.length === 1) {
      if (scale > 1.1) {
        isPanning.current = true;
        panStart.current = { x: e.touches[0].clientX - translate.x, y: e.touches[0].clientY - translate.y };
      } else {
        swipeStartX.current = e.touches[0].clientX;
        swipeDelta.current = 0;
      }
    }
  }, [scale, translate]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current > 0) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.min(Math.max(pinchScale.current * (dist / pinchStart.current), 1), 5);
      setScale(newScale);
      if (newScale <= 1.05) setTranslate({ x: 0, y: 0 });
    } else if (e.touches.length === 1) {
      if (isPanning.current && scale > 1.1) {
        setTranslate({
          x: e.touches[0].clientX - panStart.current.x,
          y: e.touches[0].clientY - panStart.current.y,
        });
      } else if (scale <= 1.1) {
        swipeDelta.current = e.touches[0].clientX - swipeStartX.current;
      }
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    pinchStart.current = 0;
    isPanning.current = false;
    if (scale <= 1.1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      if (Math.abs(swipeDelta.current) > 60) {
        swipeDelta.current > 0 ? goPrev() : goNext();
      }
      swipeDelta.current = 0;
    }
  }, [scale, goNext, goPrev]);

  // Double tap to zoom
  const lastTap = useRef(0);
  const handleTap = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (scale > 1.1) {
        resetZoom();
      } else {
        setScale(3);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTranslate({
            x: (rect.width / 2 - (e.clientX - rect.left)) * 2,
            y: (rect.height / 2 - (e.clientY - rect.top)) * 2,
          });
        }
      }
    }
    lastTap.current = now;
  }, [scale, resetZoom]);

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white z-10">
        <span className="text-sm font-medium opacity-70">{activeIdx + 1} / {images.length}</span>
        <span className="text-sm font-medium truncate mx-4 opacity-50">{name}</span>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        <div
          className="w-full h-full"
          style={{
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            transition: isPanning.current || pinchStart.current ? "none" : "transform 200ms ease-out",
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

        {/* Desktop arrows */}
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center text-white hover:bg-white/20 z-10">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm items-center justify-center text-white hover:bg-white/20 z-10">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Hint */}
      {scale <= 1.1 && (
        <div className="text-center py-2 text-white/40 text-[11px] md:hidden">
          Pinch to zoom · Double-tap · Swipe to navigate
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 justify-center px-4 py-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => { setActiveIdx(idx); resetZoom(); }}
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
