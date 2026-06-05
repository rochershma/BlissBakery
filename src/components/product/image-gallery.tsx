"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  const activeImg = images[activeIdx] || images[0];

  // Mobile swipe
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swiping = useRef(false);

  // Desktop hover zoom
  const [isHovering, setIsHovering] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const goNext = useCallback(() => setActiveIdx((i) => (i + 1) % images.length), [images.length]);
  const goPrev = useCallback(() => setActiveIdx((i) => (i - 1 + images.length) % images.length), [images.length]);

  // Mobile swipe handlers
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
    if (Math.abs(diff) > 40) { diff > 0 ? goNext() : goPrev(); }
    swiping.current = false;
  }, [images.length, goNext, goPrev]);

  // Double tap → lightbox (mobile only)
  const lastTap = useRef(0);
  const handleTap = useCallback(() => {
    if (swiping.current || !isMobile) return;
    const now = Date.now();
    if (now - lastTap.current < 300) setShowLightbox(true);
    lastTap.current = now;
  }, [isMobile]);

  // Desktop hover zoom
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    const rect = imgContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, [isMobile]);

  return (
    <div className="space-y-2 relative">
      {/* Main Image */}
      <div className="flex gap-3">
        {/* Vertical thumbnails — desktop only */}
        {!isMobile && images.length > 1 && (
          <div className="hidden md:flex flex-col gap-2 w-20 flex-shrink-0">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
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

        {/* Image container */}
        <div className="flex-1 relative">
          <div
            ref={imgContainerRef}
            className="relative aspect-square rounded-xl overflow-hidden bg-muted cursor-crosshair"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleTap}
            onMouseEnter={() => !isMobile && setIsHovering(true)}
            onMouseLeave={() => { setIsHovering(false); }}
            onMouseMove={handleMouseMove}
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

            {/* Hover lens indicator — desktop */}
            {isHovering && !isMobile && (
              <div
                className="absolute w-32 h-32 border-2 border-primary/40 bg-white/10 pointer-events-none z-20 rounded-sm"
                style={{
                  left: `${lensPos.x}%`,
                  top: `${lensPos.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}

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

            {/* Mobile arrows */}
            {images.length > 1 && isMobile && (
              <>
                <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/70 flex items-center justify-center shadow-sm z-10">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/70 flex items-center justify-center shadow-sm z-10">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Dots */}
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

            {/* Counter */}
            {images.length > 1 && (
              <span className="absolute top-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full z-10">
                {activeIdx + 1}/{images.length}
              </span>
            )}
          </div>

          {/* Zoomed panel — overlay inside image on hover */}
          {isHovering && !isMobile && (
            <div
              className="absolute inset-0 z-[30] rounded-xl overflow-hidden pointer-events-none bg-white"
            >
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url(${activeImg})`,
                  backgroundSize: "250%",
                  backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
                  backgroundRepeat: "no-repeat",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Horizontal thumbnails — mobile only */}
      {isMobile && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
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

      {/* Lightbox — mobile only (double-tap) */}
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
