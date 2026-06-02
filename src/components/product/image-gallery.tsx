"use client";

import { useState } from "react";
import Image from "next/image";
import { Leaf, ZoomIn } from "lucide-react";
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

  return (
    <div className="space-y-2">
      {/* Main Image */}
      <div
        className="relative aspect-square rounded-xl overflow-hidden bg-muted group cursor-zoom-in"
        onClick={() => setShowLightbox(true)}
      >
        <Image
          src={activeImg}
          alt={name}
          fill
          quality={90}
          className="object-cover transition-opacity duration-300"
          sizes="(max-width:768px) 100vw,40vw"
          priority
        />
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="bg-white/90 backdrop-blur-sm text-[9px] font-medium text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Leaf className="w-2.5 h-2.5" />100% Eggless
          </span>
          {isBestseller && (
            <span className="bg-primary text-primary-foreground text-[9px] font-medium px-1.5 py-0.5 rounded-full">
              ★ Best
            </span>
          )}
        </div>
        {/* Zoom hint */}
        <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-3 h-3" /> Tap to zoom
        </div>
        {/* Image counter */}
        {images.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
            {activeIdx + 1} / {images.length}
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
              onMouseEnter={() => setActiveIdx(idx)}
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

      {/* Lightbox */}
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
