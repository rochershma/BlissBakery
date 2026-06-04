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
  0: "Order handcrafted cakes, pastries, brownies, and custom celebration cakes from Bliss Bakery in Kuchaman City. Premium ingredients, soft sponge, elegant designs, and same-day delivery before 8 PM.",
  1: "Rich Belgian chocolate truffle cakes for every celebration — freshly baked with premium ingredients.",
  2: "Custom cakes for birthdays, weddings & special moments — share your dream, we'll make it real.",
};

const defaultCtas: Record<number, string> = {
  0: "Order Cake Now",
  1: "Explore Cakes",
  2: "Design Your Cake",
};

export function HeroSlider({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null;

  return (
    <section className="px-4 md:px-5 pt-6 md:pt-8 pb-0">
      <div className="max-w-[1200px] mx-auto">
        <Swiper
          modules={[Autoplay, EffectFade, Pagination]}
          effect="fade"
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          loop={banners.length > 1}
          className="hero-swiper"
        >
          {banners.map((banner, i) => {
            const isDesigned = banner.mediaUrl.includes("bakingo-") || banner.mediaUrl.includes("cloudinary") || banner.hasEmbeddedText;

            return (
              <SwiperSlide key={banner.id}>
                <div className="hero-premium relative min-h-[500px] md:min-h-[540px]">
                  {/* Full-bleed background image */}
                  <div className="absolute inset-0 overflow-hidden rounded-[34px]">
                    <Image
                      src={banner.mediaUrl}
                      alt={banner.title || "Bliss Bakery"}
                      fill
                      className="object-cover object-center hero-premium-img"
                      priority={i === 0}
                      sizes="100vw"
                      quality={90}
                    />
                  </div>

                  {/* Content overlay — left side */}
                  <div className="relative z-[2] w-full md:w-[44%] md:max-w-[460px] min-h-[500px] md:min-h-[540px] flex flex-col justify-end md:justify-center p-5 md:p-[42px]">
                    {/* Eyebrow badge */}
                    <div className="eyebrow-badge reveal mb-4 self-start">
                      🌿 Fresh today — 100% vegetarian &amp; eggless
                    </div>

                    {/* Headline */}
                    <h1 className="reveal reveal-delay-1 text-[32px] md:text-[clamp(40px,4vw,56px)] font-serif font-bold text-white leading-[0.96] tracking-[-0.055em] max-w-[460px]"
                      style={{ textShadow: "0 8px 34px rgba(42,31,34,0.32)" }}
                    >
                      {isDesigned
                        ? "Fresh eggless cakes delivered today."
                        : (banner.title || "Fresh eggless cakes delivered today.")
                      }
                    </h1>

                    {/* Description */}
                    <p className="reveal reveal-delay-2 text-white/[0.88] text-sm md:text-[15px] leading-[1.62] mt-3.5 max-w-[430px]">
                      {defaultSubtitles[i] || "Handcrafted with love in Kuchaman City — premium ingredients, same-day delivery."}
                    </p>

                    {/* CTAs */}
                    <div className="reveal reveal-delay-3 flex items-center gap-3.5 mt-5 flex-col md:flex-row">
                      <Link
                        href={banner.linkUrl || "/store/kuchaman-city/menu"}
                        className="btn-premium btn-premium-primary text-sm w-full md:w-auto"
                      >
                        {defaultCtas[i] || "Order Now"}
                      </Link>
                      <Link
                        href="/store/kuchaman-city/menu?bestseller=true"
                        className="btn-premium btn-premium-secondary text-sm w-full md:w-auto"
                      >
                        View Bestsellers
                      </Link>
                    </div>

                    {/* Trust pills */}
                    <div className="reveal reveal-delay-3 grid grid-cols-2 gap-2 mt-4 max-w-[350px]">
                      <div className="trust-pill">100% Eggless</div>
                      <div className="trust-pill">Same-Day Delivery</div>
                      <div className="trust-pill">Freshly Baked</div>
                      <div className="trust-pill">Custom Cakes</div>
                    </div>
                  </div>

                  {/* Rating card — top right */}
                  <div className="rating-card-hero hidden md:block reveal reveal-delay-2">
                    <span className="block mb-1 text-[var(--gold)] tracking-[0.08em] font-bold">★★★★★ 4.9 RATED</span>
                    Loved for fresh eggless cakes
                  </div>

                  {/* Floating card — bottom right */}
                  <div className="floating-card-hero hidden md:block right-[34px] bottom-[34px] w-[220px] reveal reveal-delay-3">
                    <strong className="block font-serif text-lg leading-[1.1] tracking-[-0.04em]">Order before 8 PM</strong>
                    <p className="mt-2 text-muted-foreground text-xs leading-[1.5]">Same-day cakes, pastries, and celebration desserts across Kuchaman City.</p>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
