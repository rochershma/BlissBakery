import Link from "next/link";
import Image from "next/image";

interface ExploreRangesProps {
  storeSlug: string;
  occasions: { id: string; slug: string; name: string; image: string | null }[];
  themes: { id: string; slug: string; name: string; image: string | null }[];
}

export function ExploreRanges({ storeSlug, occasions, themes }: ExploreRangesProps) {
  if (occasions.length === 0 && themes.length === 0) return null;

  return (
    <section className="border-t border-border/50">
      <div className="max-w-[1300px] mx-auto w-full px-4 md:px-5 py-10">
        <p className="section-kicker">Explore More</p>
        <h3 className="text-xl font-bold text-foreground font-serif mb-5">Our Cake Ranges</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
          <Link href={`/store/${storeSlug}/menu`} prefetch={false} className="flex-shrink-0 w-[200px] md:w-[240px] group">
            <div className="relative h-[160px] md:h-[180px] rounded-2xl overflow-hidden bg-chocolate shadow-sm">
              <Image src="/images/categories/cakes.jpg" alt="All" fill className="object-cover group-hover:scale-105 transition-all duration-300" sizes="240px" />
              <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent h-16 pointer-events-none" />
              <span className="absolute bottom-3 left-3.5 right-3 text-white font-serif font-bold text-sm drop-shadow-lg">View All Menu</span>
            </div>
          </Link>
          {occasions.map((occ) => (
            <Link key={occ.id} href={`/cakes/${occ.slug}`} prefetch={false} className="flex-shrink-0 w-[200px] md:w-[240px] group">
              <div className="relative h-[160px] md:h-[180px] rounded-2xl overflow-hidden bg-chocolate shadow-sm">
                {occ.image ? (
                  <Image src={occ.image} alt={occ.name} fill className="object-cover group-hover:scale-105 transition-all duration-300" sizes="240px" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent h-16 pointer-events-none" />
                <span className="absolute bottom-3 left-3.5 right-3 text-white font-serif font-bold text-sm drop-shadow-lg">{occ.name}</span>
              </div>
            </Link>
          ))}
          {themes.map((t) => (
            <Link key={t.id} href={`/themes/${t.slug}`} prefetch={false} className="flex-shrink-0 w-[200px] md:w-[240px] group">
              <div className="relative h-[160px] md:h-[180px] rounded-2xl overflow-hidden bg-chocolate shadow-sm">
                {t.image ? (
                  <Image src={t.image} alt={t.name} fill className="object-cover group-hover:scale-105 transition-all duration-300" sizes="240px" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent h-16 pointer-events-none" />
                <span className="absolute bottom-3 left-3.5 right-3 text-white font-serif font-bold text-sm drop-shadow-lg">{t.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
