import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";

interface ExploreRangesProps {
  storeSlug: string;
  occasions: { id: string; slug: string; name: string; image: string | null }[];
  themes: { id: string; slug: string; name: string; image: string | null }[];
}

export function ExploreRanges({ storeSlug, occasions, themes }: ExploreRangesProps) {
  if (occasions.length === 0 && themes.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-background to-surface-blush/50 py-10 md:py-14">
      <div className="max-w-[1300px] mx-auto w-full px-4 md:px-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="section-kicker">Explore More</p>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-foreground font-serif mb-6 tracking-[-0.02em]">Our Cake Collections</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          <Link href={`/store/${storeSlug}/menu`} prefetch={false} className="group">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5">
              <Image src="/images/categories/cakes.jpg" alt="All" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:640px) 50vw,20vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <span className="absolute bottom-3 left-3.5 right-3 text-white font-serif font-bold text-sm drop-shadow-lg">View All Menu</span>
            </div>
          </Link>
          {occasions.map((occ) => (
            <Link key={occ.id} href={`/cakes/${occ.slug}`} prefetch={false} className="group">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5">
                {occ.image ? (
                  <Image src={occ.image} alt={occ.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:640px) 50vw,20vw" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <span className="absolute bottom-3 left-3.5 right-3 text-white font-serif font-bold text-sm drop-shadow-lg">{occ.name}</span>
              </div>
            </Link>
          ))}
          {themes.map((t) => (
            <Link key={t.id} href={`/themes/${t.slug}`} prefetch={false} className="group">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5">
                {t.image ? (
                  <Image src={t.image} alt={t.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:640px) 50vw,20vw" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <span className="absolute bottom-3 left-3.5 right-3 text-white font-serif font-bold text-sm drop-shadow-lg">{t.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
