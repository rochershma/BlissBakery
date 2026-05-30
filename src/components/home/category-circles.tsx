"use client";

import Link from "next/link";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const categoryImages: Record<string, { emoji: string; bg: string }> = {
  cakes:              { emoji: "🎂", bg: "from-pink-100 to-pink-50" },
  pastries:           { emoji: "🧁", bg: "from-purple-100 to-purple-50" },
  brownies:           { emoji: "🍫", bg: "from-amber-100 to-amber-50" },
  "cookies-biscuits": { emoji: "🍪", bg: "from-yellow-100 to-yellow-50" },
  breads:             { emoji: "🍞", bg: "from-orange-100 to-orange-50" },
  combos:             { emoji: "🎁", bg: "from-red-100 to-red-50" },
  beverages:          { emoji: "☕", bg: "from-emerald-100 to-emerald-50" },
};

export function CategoryCircles({ categories, storeSlug }: { categories: Category[]; storeSlug: string }) {
  return (
    <section className="py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar justify-start md:justify-center pb-2">
          {categories.map((cat) => {
            const style = categoryImages[cat.slug] || { emoji: "🍰", bg: "from-gray-100 to-gray-50" };
            return (
              <Link
                key={cat.id}
                href={`/store/${storeSlug}/menu?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 flex-shrink-0 group"
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-b ${style.bg} flex items-center justify-center text-2xl md:text-3xl shadow-sm border border-white/80 group-hover:shadow-md group-hover:scale-110 transition-all duration-300`}>
                  {style.emoji}
                </div>
                <span className="text-[11px] md:text-xs font-medium text-foreground text-center leading-tight group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
              </Link>
            );
          })}
          {/* Custom Cakes circle */}
          <Link
            href={`/store/${storeSlug}/custom-cakes`}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-b from-primary/20 to-primary/5 flex items-center justify-center text-2xl md:text-3xl shadow-sm border border-primary/20 group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
              ✨
            </div>
            <span className="text-[11px] md:text-xs font-medium text-primary text-center leading-tight">
              Custom<br />Cakes
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
