"use client";

import Image from "next/image";
import Link from "next/link";

interface Banner {
  id: string;
  title: string | null;
  mediaUrl: string;
  linkUrl: string | null;
}

export function HeroSlider({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null;

  const banner = banners[0];

  return (
    <div className="relative rounded-[28px] md:rounded-[42px] overflow-hidden shadow-lg">
      <Link href={banner.linkUrl || "/store/kuchaman-city/menu"} className="block">
        <div className="relative w-full" style={{ aspectRatio: "16/7" }}>
          <Image
            src={banner.mediaUrl}
            alt={banner.title || "Bliss Bakery"}
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
            quality={90}
          />
          {banner.title && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-start justify-end p-6 md:p-10">
                <p className="text-primary text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase mb-1">
                  100% Veg & Eggless
                </p>
                <h2 className="text-xl md:text-3xl font-bold text-white font-serif leading-tight max-w-md">
                  {banner.title}
                </h2>
                <span className="mt-3 inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-full">
                  Order Now
                </span>
              </div>
            </>
          )}
        </div>
      </Link>
    </div>
  );
}
