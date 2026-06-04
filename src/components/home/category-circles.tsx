"use client";

import Link from "next/link";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  /** First product image from this category, used as thumbnail */
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
    <section className="mt-5 md:mt-7">
      <div className="max-w-[1200px] mx-auto px-4 md:px-5">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1" style={{ scrollSnapType: "x mandatory" }}>
          {categories.map((cat) => {
            const img = cat.image || cat.productImage || fallbackImages[cat.slug] || "/images/categories/cakes.jpg";
            return (
              <Link
                key={cat.id}
                href={`/store/${storeSlug}/menu?category=${cat.slug}`}
                className="cat-card-premium flex-shrink-0 block"
              >
                <div className="w-full h-full overflow-hidden rounded-[16px]">
                  <Image
                    src={img}
                    alt={cat.name}
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                </div>
                <span className="absolute left-3 right-3 bottom-3 z-[2] text-white font-serif text-[16px] font-bold leading-[1.05] tracking-[-0.04em]"
                  style={{ textShadow: "0 5px 16px rgba(42,31,34,0.4)" }}
                >
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
