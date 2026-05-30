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

  return (
    <section className="relative h-[40vh] md:h-[50vh] lg:h-[55vh] overflow-hidden bg-dark-bg">
      <Swiper
        modules={[Autoplay, EffectFade, Pagination]}
        effect="fade"
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={banners.length > 1}
        className="h-full hero-swiper"
      >
        {banners.map((banner, i) => (
          <SwiperSlide key={banner.id}>
            <div className="relative h-full">
              <Image
                src={banner.mediaUrl}
                alt={banner.title || "Bliss Bakery"}
                fill
                className="object-cover object-center"
                style={{ opacity: 0.45 }}
                priority={i === 0}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <div className="animate-fade-in-up">
                  <p className="label-premium text-primary mb-2 tracking-[0.3em] text-[10px] md:text-xs">
                    100% Veg & Eggless
                  </p>
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 font-serif leading-tight whitespace-pre-line">
                    {banner.title || "Bliss Bakery"}
                  </h2>
                  <p className="text-white/60 text-xs md:text-sm mb-5 max-w-lg mx-auto">
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
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
