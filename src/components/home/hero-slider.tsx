"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import "swiper/css";
import "swiper/css/pagination";

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  mediaUrl: string;
  mobileMediaUrl: string | null;
  linkUrl: string | null;
  hasEmbeddedText?: boolean;
}

export function HeroSlider({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null;

  // Split banners by device:
  // Desktop: any banner with mediaUrl (desktop image)
  const desktopBanners = banners.filter(b => b.mediaUrl);
  // Mobile: banners with mobileMediaUrl; fallback to all if none have mobile
  const mobileBanners = banners.filter(b => b.mobileMediaUrl);
  const effectiveMobileBanners = mobileBanners.length > 0 ? mobileBanners : banners;

  const renderSlide = (banner: Banner, i: number, isMobile: boolean) => {
    const hasText = banner.title || banner.subtitle || banner.ctaText;
    const imgSrc = isMobile ? (banner.mobileMediaUrl || banner.mediaUrl) : banner.mediaUrl;

    return (
      <SwiperSlide key={banner.id}>
        <div className={`hero-premium relative ${isMobile && banner.mobileMediaUrl ? 'hero-has-mobile' : ''} ${hasText ? 'has-text' : ''}`}>
          <div className={`absolute inset-0 overflow-hidden ${isMobile ? 'rounded-[16px]' : 'rounded-[22px]'}`}>
            <Image
              src={imgSrc}
              alt={banner.title || "Bliss Bakery"}
              fill
              className="object-cover object-center hero-premium-img"
              priority={i === 0}
              loading={i === 0 ? undefined : "lazy"}
              sizes={isMobile ? "100vw" : "1300px"}
              quality={i === 0 ? 85 : 70}
            />
          </div>
          {hasText && (
            <div className={`relative z-[2] h-full flex flex-col ${isMobile ? 'w-full justify-end p-5' : 'w-[44%] max-w-[460px] justify-center p-[42px]'}`}>
              {banner.title && (
                <h2 className={`font-serif font-bold text-white leading-[1.05] tracking-[-0.03em] drop-shadow-lg ${isMobile ? 'text-[22px]' : 'text-[clamp(36px,3.5vw,48px)] max-w-[460px]'}`}>
                  {banner.title}
                </h2>
              )}
              {banner.subtitle && (
                <p className={`text-white/90 leading-[1.5] drop-shadow-md ${isMobile ? 'text-[13px] mt-2' : 'text-[15px] mt-3 max-w-[430px]'}`}>
                  {banner.subtitle}
                </p>
              )}
              {banner.ctaText && (
                <div className={`flex items-center gap-3.5 ${isMobile ? 'mt-4' : 'mt-5'}`}>
                  <Link href={banner.ctaLink || banner.linkUrl || "/store/kuchaman-city/menu"} className="btn-premium btn-premium-primary text-sm">
                    {banner.ctaText}
                  </Link>
                </div>
              )}
            </div>
          )}
          {!hasText && banner.linkUrl && (
            <Link href={banner.linkUrl} className="absolute inset-0 z-[2]">
              <span className="sr-only">{banner.title || "View banner"}</span>
            </Link>
          )}
        </div>
      </SwiperSlide>
    );
  };

  return (
    <section className="pt-4 md:pt-8 pb-4 md:pb-8">
      <div className="max-w-[1300px] mx-auto px-3 md:px-5">
        {/* Desktop carousel */}
        <div className="hidden md:block">
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop={desktopBanners.length > 1}
            className="hero-swiper"
            spaceBetween={0}
          >
            {desktopBanners.map((b, i) => renderSlide(b, i, false))}
          </Swiper>
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden">
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop={effectiveMobileBanners.length > 1}
            className="hero-swiper"
            spaceBetween={0}
          >
            {effectiveMobileBanners.map((b, i) => renderSlide(b, i, true))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
