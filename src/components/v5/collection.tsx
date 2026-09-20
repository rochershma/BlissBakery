"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { img } from "@/lib/img";
import { ProductCard, type CardProduct } from "./product-card";
import { IconChevD, IconFilter, IconPlus } from "./icons";

export type FilterGroup = {
  key: string;
  label: string;
  type: "check" | "pill";
  options: { value: string; label: string }[];
};

export type SubTag = { slug: string; name: string; image?: string | null };

const PAGE = 24;

export function Collection({
  title,
  subtitle,
  crumbs,
  subTagLabel,
  subTags = [],
  groups,
  products,
}: {
  title: string;
  subtitle?: string | null;
  crumbs: { label: string; href?: string }[];
  subTagLabel?: string;
  subTags?: SubTag[];
  groups: FilterGroup[];
  products: (CardProduct & { _price: number; _tags: string[]; _kg: number[]; _flav: string[]; _new: number })[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const activeTag = params.get("tag") || "";
  const [sel, setSel] = useState<Record<string, Set<string>>>({});
  const [sort, setSort] = useState("popular");
  const [shown, setShown] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);
  const showMore = () => setShown((s) => s + PAGE);
  const [open, setOpen] = useState<Record<string, boolean>>(
    () => Object.fromEntries(groups.map((g, i) => [g.key, i < 3])),
  );
  const [sheet, setSheet] = useState(false);

  const toggle = (k: string, v: string) => {
    setSel((p) => {
      const next = new Set(p[k] ?? []);
      next.has(v) ? next.delete(v) : next.add(v);
      return { ...p, [k]: next };
    });
    setShown(PAGE);
  };

  const setTag = (slug: string) => {
    const q = new URLSearchParams(Array.from(params.entries()));
    slug && slug !== activeTag ? q.set("tag", slug) : q.delete("tag");
    router.push(`${pathname}?${q.toString()}`, { scroll: false });
  };

  const filtered = useMemo(() => {
    let out = products;
    if (activeTag) out = out.filter((p) => p._tags.includes(activeTag));

    for (const g of groups) {
      const chosen = sel[g.key];
      if (!chosen?.size) continue;
      out = out.filter((p) => {
        if (g.key === "price") {
          return [...chosen].some((c) => {
            const [lo, hi] = c.split("-").map(Number);
            return p._price >= lo && (isNaN(hi) || p._price <= hi);
          });
        }
        if (g.key === "size") return [...chosen].some((c) => p._kg.includes(Number(c)));
        if (g.key === "flavour") return [...chosen].some((c) => p._flav.includes(c));
        return [...chosen].some((c) => p._tags.includes(c));
      });
    }

    const s = [...out];
    if (sort === "low") s.sort((a, b) => a._price - b._price);
    else if (sort === "high") s.sort((a, b) => b._price - a._price);
    else if (sort === "new") s.sort((a, b) => b._new - a._new);
    else s.sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller));
    return s;
  }, [products, activeTag, sel, groups, sort]);

  const activeCount = Object.values(sel).reduce((n, s) => n + s.size, 0) + (activeTag ? 1 : 0);
  const clearAll = () => { setSel({}); setTag(""); setShown(PAGE); };

  // Reveal the next page as the sentinel scrolls into view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || shown >= filtered.length) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && showMore(),
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, filtered.length]);

  const rail = (
    <aside className="filters">
      <div className="filters__hd">
        <b>Filters</b>
        {activeCount > 0 ? (
          <button type="button" className="btn btn--ghost btn--sm" onClick={clearAll}>Clear all</button>
        ) : null}
      </div>
      {groups.map((g) => (
        <div key={g.key} className={`fgroup${open[g.key] ? " open" : ""}`}>
          <button type="button" className="fgroup__b" onClick={() => setOpen((p) => ({ ...p, [g.key]: !p[g.key] }))} aria-expanded={!!open[g.key]}>
            {g.label}
            <IconChevD />
          </button>
          <div className="fgroup__p">
            {g.type === "pill" ? (
              <div className="fpills">
                {g.options.map((o) => (
                  <button key={o.value} type="button" className="chip chip--sm"
                    aria-pressed={sel[g.key]?.has(o.value) || false}
                    onClick={() => toggle(g.key, o.value)}>{o.label}</button>
                ))}
              </div>
            ) : (
              g.options.map((o) => (
                <label className="fopt" key={o.value}>
                  <input type="checkbox" checked={sel[g.key]?.has(o.value) || false} onChange={() => toggle(g.key, o.value)} />
                  <span>{o.label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      ))}
    </aside>
  );

  return (
    <div className="wrap" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <p className="t-small v5crumbs">
        {crumbs.map((c, i) => (
          <span key={i}>
            {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
            {i < crumbs.length - 1 ? <i>/</i> : null}
          </span>
        ))}
      </p>

      <h1 className="d2" style={{ marginTop: 10 }}>{title}</h1>
      {subtitle ? <p className="plp__intro">{subtitle}</p> : null}

      {subTags.length > 0 && (
        <div className="subtags__wrap">
          {subTagLabel ? <p className="t-micro subtags__lbl">{subTagLabel}</p> : null}
          <div className="subtags">
            {subTags.map((t, i) => (
              <button key={t.slug} type="button" className="subtag" aria-pressed={activeTag === t.slug} onClick={() => setTag(t.slug)}>
                <span className="subtag__img">
                  {t.image ? <Image src={img(t.image, 190, 190)} alt="" width={190} height={190} unoptimized loading={i < 6 ? "eager" : "lazy"} /> : null}
                </span>
                <b>{t.name}</b>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="plp" style={{ marginTop: 16 }}>
        <div className="plp__rail">{rail}</div>

        <div>
          <div className="plp__bar">
            <button type="button" className="btn btn--out btn--sm plp__filterbtn" onClick={() => setSheet(true)}>
              <IconFilter /> Filters{activeCount ? ` · ${activeCount}` : ""}
            </button>
            {activeCount > 0 ? (
              <button type="button" className="btn btn--ghost btn--sm plp__clear" onClick={clearAll}>Clear</button>
            ) : null}
            <label className="plp__sort">
              <span className="t-small">Sort</span>
              <select className="select" value={sort} onChange={(e) => { setSort(e.target.value); setShown(PAGE); }}>
                <option value="popular">Most popular</option>
                <option value="low">Price — low to high</option>
                <option value="high">Price — high to low</option>
                <option value="new">Newest</option>
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <div className="v5empty">
              <IconPlus />
              <h3 className="t-h3">No cakes match those filters</h3>
              <p className="t-small">Try widening the price range or clearing a filter.</p>
              <button type="button" className="btn btn--rose btn--sm" onClick={clearAll}>Clear filters</button>
            </div>
          ) : (
            <>
              <div className="v5grid">
                {filtered.slice(0, shown).map((p, i) => <ProductCard key={p.href} p={p} eager={i < 6} />)}
              </div>
              {shown < filtered.length ? (
                <div className="plp__more" ref={sentinel}>
                  {/* The sentinel loads the next page on scroll; the button is the
                      keyboard and reduced-motion path to the same thing. */}
                  <button type="button" className="btn btn--out btn--sm" onClick={showMore}>
                    Show more cakes
                  </button>
                  <span className="t-small">{shown} of {filtered.length}</span>
                </div>
              ) : (
                <p className="plp__end t-small">That&apos;s all {filtered.length} cakes</p>
              )}
            </>
          )}
        </div>
      </div>

      {sheet && (
        <div className="v5sheet" role="dialog" aria-modal="true">
          <button type="button" className="v5sheet__bg" onClick={() => setSheet(false)} aria-label="Close filters" />
          <div className="v5sheet__panel">
            <div className="v5sheet__hd">
              <b className="t-h3">Filters</b>
              <button type="button" className="btn btn--ghost btn--sm" onClick={clearAll}>Clear all</button>
            </div>
            <div className="v5sheet__body">{rail}</div>
            <div className="v5sheet__ft">
              <button type="button" className="btn btn--rose btn--block btn--lg" onClick={() => setSheet(false)}>
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
