import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { img } from "@/lib/img";

export type CardProduct = {
  name: string;
  href: string;
  image: string | null;
  price: number;
  /** true when the price is a "from" price driven by flavour + size */
  isFrom?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  sub?: string | null;
};

export function ProductCard({ p, size = 420, eager = false }: { p: CardProduct; size?: number; eager?: boolean }) {
  return (
    <Link className="card" href={p.href}>
      <div className="card__media">
        {p.image ? (
          <Image
            src={img(p.image, size, size)}
            alt={p.name}
            width={size}
            height={size}
            unoptimized
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
          />
        ) : (
          <div className="sk" style={{ width: "100%", height: "100%" }} />
        )}
        <div className="card__top">
          <span>
            {p.isBestseller ? (
              <span className="badge badge--rose">Bestseller</span>
            ) : p.isNew ? (
              <span className="badge badge--soft">New</span>
            ) : null}
          </span>
          <span className="card__veg">
            <span className="veg" aria-label="Pure veg" />
          </span>
        </div>
      </div>
      <div className="card__body">
        <h3 className="card__name">{p.name}</h3>
        {p.sub ? <span className="card__sub">{p.sub}</span> : null}
        <div className="card__foot">
          <div className="card__price">
            {p.isFrom ? <span>from</span> : null}
            <b>{formatPrice(p.price)}</b>
          </div>
          <span className="card__add">Add</span>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card">
      <div className="sk" style={{ aspectRatio: "1", borderRadius: 0 }} />
      <div className="card__body">
        <div className="sk" style={{ height: 13, width: "88%" }} />
        <div className="sk" style={{ height: 13, width: "60%", marginTop: 4 }} />
        <div className="card__foot">
          <div className="sk" style={{ height: 16, width: 58 }} />
          <div className="sk" style={{ height: 30, width: 56, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}
