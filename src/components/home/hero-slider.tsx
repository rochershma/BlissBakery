"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

interface Banner {
  id: string;
  title: string | null;
  mediaUrl: string;
  linkUrl: string | null;
  /** If true, show the image as-is without text overlay (for designed banners) */
  hasEmbeddedText?: boolean;
}

const defaultSubtitles: Record<number, string> = {
  0: "Premium eggless cakes & pastries — handcrafted daily",
  1: "Rich Belgian chocolate truffle cakes for every celebration",
  2: "Custom cakes for birthdays, weddings & special moments",
};

const defaultCtas: Record<number, string> = {
  0: "Order Now",
  1: "Explore Cakes",
  2: "Custom Cake",
};

export function HeroSlider({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null;

  // Check if banners have designed images (no text overlay needed)
  const hasDesignedBanners = banners.some(b =>
    b.mediaUrl.includes("bakingo-") || b.hasEmbeddedText
  );

  return (
    <section className="relative overflow-hidden bg-[#f5ebe0]">
      <Swiper
        modules={[Autoplay, EffectFade, Pagination]}
        effect="fade"
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={banners.length > 1}
        className="hero-swiper"
      >
        {banners.map((banner, i) => {
          const isDesigned = banner.mediaUrl.includes("bakingo-") || banner.hasEmbeddedText;

          return (
            <SwiperSlide key={banner.id}>
              {isDesigned ? (
                /* Designed banner — show image as-is, no overlay */
                <Link href={banner.linkUrl || "/"} className="block">
                  <div className="relative w-full aspect-[16/9] sm:aspect-[16/7] md:aspect-[21/8]">
                    <Image
                      src={banner.mediaUrl}
                      alt={banner.title || "Bliss Bakery"}
                      fill
                      className="object-cover object-center"
                      priority={i === 0}
                      sizes="100vw"
                      quality={90}
                    />
                  </div>
                </Link>
              ) : (
                /* Legacy banner — text overlay style */
                <div className="relative aspect-[16/9] sm:aspect-[16/7] md:aspect-[21/8]">
                  <Image
                    src={banner.mediaUrl}
                    alt={banner.title || "Bliss Bakery"}
                    fill
                    className="object-cover object-center"
                    style={{ opacity: 0.55 }}
                    priority={i === 0}
                    sizes="100vw"
                    quality={90}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <div className="animate-fade-in-up">
                      <p className="label-premium text-primary mb-2 tracking-[0.3em] text-[10px] md:text-xs">
                        100% Veg & Eggless
                      </p>
                      <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 font-serif leading-tight whitespace-pre-line">
                        {banner.title || "Bliss Bakery"}
                      </h2>
                      <p className="text-white/70 text-xs md:text-sm mb-5 max-w-lg mx-auto">
                        {defaultSubtitles[i] || "Handcrafted with love in Kuchaman City"}
                      </p>
                      {banner.linkUrl && (
                        <Link
                          href={banner.linkUrl}
                          className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold text-sm hover:bg-primary-hover transition-all shadow-xl shadow-primary/30 btn-press inline-block"
                        >
                          {defaultCtas[i] || "Shop Now"}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
