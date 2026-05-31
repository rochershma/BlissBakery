"use client";

import { Leaf, Clock, Star, Sparkles, Tag } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="bg-dark-bg text-dark-text overflow-hidden">
      <div className="flex items-center gap-8 py-2 animate-marquee whitespace-nowrap">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-8 text-xs tracking-wide">
            <span className="flex items-center gap-1.5 text-primary font-semibold">
              <Tag className="w-3 h-3" />
              Use WELCOME10 for 10% OFF
            </span>
            <span className="text-primary/40">✦</span>
            <span className="flex items-center gap-1.5">
              <Leaf className="w-3 h-3 text-primary" />
              100% Veg & Eggless
            </span>
            <span className="text-primary/40">✦</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-primary" />
              Same Day Delivery
            </span>
            <span className="text-primary/40">✦</span>
            <span className="flex items-center gap-1.5">
              <Star className="w-3 h-3 text-primary" />
              Premium Quality
            </span>
            <span className="text-primary/40">✦</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              Handcrafted in Kuchaman City
            </span>
            <span className="text-primary/40">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
