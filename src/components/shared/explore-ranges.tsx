import Link from "next/link";
import Image from "next/image";

interface ExploreRangesProps {
  storeSlug: string;
  occasions: { id: string; slug: string; name: string; image: string | null }[];
  themes: { id: string; slug: string; name: string; image: string | null }[];
}

/** Keeps a customer moving when the results run out. Same mosaic language as
 *  the homepage, so search does not read as a different site. */
export function ExploreRanges({ storeSlug, occasions, themes }: ExploreRangesProps) {
  if (occasions.length === 0 && themes.length === 0) return null;

  const items = [
    { key: "all", name: "The full menu", href: `/store/${storeSlug}/menu`, image: "/images/categories/cakes.jpg" },
    ...occasions.map((o) => ({ key: o.id, name: o.name, href: `/cakes/${o.slug}`, image: o.image })),
    ...themes.map((t) => ({ key: t.id, name: t.name, href: `/themes/${t.slug}`, image: t.image })),
  ];

  return (
    <section className="sec sec--cream">
      <div className="wrap">
        <div className="sec-head sec-head--rule">
          <h2 className="t-h2">Keep looking</h2>
        </div>
      </div>
      <div className="mosaic">
        {items.map((i) => (
          <Link className="mosaic__i" key={i.key} href={i.href} prefetch={false}>
            {i.image ? (
              <Image src={i.image} alt="" width={320} height={320} loading="lazy" unoptimized />
            ) : null}
            <span>{i.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
