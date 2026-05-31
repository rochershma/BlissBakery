"use client";

import Link from "next/link";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  /** First product image from this category, used as circle thumbnail */
  productImage?: string | null;
}

const fallbackImages: Record<string, string> = {
  cakes: "/images/categories/cakes.jpg",
  pastries: "/images/categories/pastries.jpg",
  brownies: "/images/categories/brownies.jpg",
  "cookies-biscuits": "/images/categories/cookies.jpg",
  breads: "/images/categories/breads.jpg",
  combos: "/images/categories/combos.jpg",
  beverages: "/images/categories/beverages.jpg",
  "designer-cakes": "/images/categories/designer-cakes.jpg",
  "occasion-cakes": "/images/categories/occasion-cakes.jpg",
};

export function CategoryCircles({ categories, storeSlug }: { categories: Category[]; storeSlug: string }) {
  return (
    <section className="py-5 md:py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar justify-start md:justify-center pb-2">
          {categories.map((cat) => {
            const img = cat.image || cat.productImage || fallbackImages[cat.slug] || "/images/categories/cakes.jpg";
            return (
              <Link
                key={cat.id}
                href={`/store/${storeSlug}/menu?category=${cat.slug}`}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden shadow-sm border-2 border-white group-hover:shadow-lg group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300 relative">
                  <Image src={img} alt={cat.name} fill className="object-cover" sizes="80px" />
                </div>
                <span className="text-[11px] md:text-xs font-medium text-foreground text-center leading-tight group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
              </Link>
            );
          })}
          <Link
            href={`/store/${storeSlug}/custom-cakes`}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden shadow-sm border-2 border-primary/30 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 relative">
              <Image src="/images/categories/designer.jpg" alt="Custom Cakes" fill className="object-cover" sizes="80px" />
            </div>
            <span className="text-[11px] md:text-xs font-medium text-primary text-center leading-tight">
              Custom
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
