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
  subtitle: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  mediaUrl: string;
  linkUrl: string | null;
  hasEmbeddedText?: boolean;
}

export function HeroSlider({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null;

  // Check if ANY banner has text content to overlay
  const hasAnyText = banners.some(b => b.title || b.subtitle || b.ctaText);

  return (
    <section className="pt-6 md:pt-8 pb-0">
      <div className="max-w-[1300px] mx-auto px-4 md:px-5">
        <Swiper
          modules={[Autoplay, EffectFade, Pagination]}
          effect="fade"
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          loop={banners.length > 1}
          className="hero-swiper"
        >
          {banners.map((banner, i) => {
            const hasText = banner.title || banner.subtitle || banner.ctaText;

            return (
              <SwiperSlide key={banner.id}>
                <div className="hero-premium relative">
                  {/* Full-bleed background image */}
                  <div className="absolute inset-0 overflow-hidden rounded-[22px] md:rounded-[22px]">
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

                  {/* Content overlay — only if banner has text from admin */}
                  {hasText && (
                    <div className="relative z-[2] w-full md:w-[44%] md:max-w-[460px] h-full flex flex-col justify-end md:justify-center p-4 md:p-[42px]">
                      {/* Title */}
                      {banner.title && (
                        <h1 className="reveal reveal-delay-1 text-[28px] md:text-[clamp(36px,3.5vw,48px)] font-serif font-bold text-white leading-[0.96] tracking-[-0.055em] max-w-[460px]"
                          style={{ textShadow: "0 8px 34px rgba(42,31,34,0.32)" }}
                        >
                          {banner.title}
                        </h1>
                      )}

                      {/* Subtitle */}
                      {banner.subtitle && (
                        <p className="reveal reveal-delay-2 text-white/[0.88] text-sm md:text-[15px] leading-[1.62] mt-3 max-w-[430px]">
                          {banner.subtitle}
                        </p>
                      )}

                      {/* CTA Button */}
                      {banner.ctaText && (
                        <div className="reveal reveal-delay-3 flex items-center gap-3.5 mt-5 flex-col md:flex-row">
                          <Link
                            href={banner.ctaLink || banner.linkUrl || "/store/kuchaman-city/menu"}
                            className="btn-premium btn-premium-primary text-sm w-full md:w-auto"
                          >
                            {banner.ctaText}
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* If no text, make entire banner clickable */}
                  {!hasText && banner.linkUrl && (
                    <Link href={banner.linkUrl} className="absolute inset-0 z-[2]">
                      <span className="sr-only">{banner.title || "View banner"}</span>
                    </Link>
                  )}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
