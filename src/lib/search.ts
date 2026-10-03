import { db } from "@/lib/db";
import { parseJsonSafe } from "@/lib/utils";

/**
 * Store-scoped product search shared by the search page, its "load more" API
 * and the suggestion endpoint, so every page of results uses the same order.
 *
 * Every matching product is scored (a store has a few hundred), then sorted:
 * products matching more of the words first, then by where they matched —
 * name beats category beats theme/occasion beats description beats flavour.
 * Most cakes can be ordered in chocolate, so a flavour hit alone ranks last.
 */
export function cleanQuery(raw: string | null | undefined): string {
  return (raw ?? "").trim().replace(/[^\w\s\-&'₹]/gi, "").substring(0, 50);
}

const PRICE_CAP = /(?:under|below|upto|up to|less than|within)\s*₹?\s*(\d+)/i;

export async function searchProductIds(storeId: string, query: string): Promise<string[]> {
  const q = cleanQuery(query).toLowerCase();
  if (q.length < 2) return [];

  const cap = q.match(PRICE_CAP);
  const maxPrice = cap ? parseInt(cap[1], 10) : null;
  const words = q
    .replace(PRICE_CAP, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !/^(cake|cakes)$/.test(w));

  const base = { isAvailable: true, category: { storeId } };
  const or = words.flatMap((w) => [
    { name: { contains: w } }, { shortDesc: { contains: w } }, { category: { name: { contains: w } } },
    { occasions: { contains: w } }, { themes: { contains: w } }, { themeTags: { contains: w } },
    { forWhom: { contains: w } }, { flavours: { contains: w } },
  ]);

  const rows = await db.product.findMany({
    where: { ...base, ...(maxPrice ? { basePrice: { lte: maxPrice } } : {}), ...(or.length ? { OR: or } : {}) },
    select: {
      id: true, name: true, shortDesc: true, occasions: true, themes: true, themeTags: true,
      forWhom: true, flavours: true, isBestseller: true, basePrice: true, category: { select: { name: true } },
    },
  });

  // "cake" alone, or a pure price query, still deserves results.
  if (!words.length) {
    return rows
      .sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller) || a.basePrice - b.basePrice)
      .map((r) => r.id);
  }

  const lists = (s: string | null) => parseJsonSafe<string[]>(s, []).join(" ").toLowerCase().replace(/[-_]/g, " ");
  const scored = rows.map((p) => {
    const name = p.name.toLowerCase();
    const cat = p.category.name.toLowerCase();
    const tags = `${lists(p.occasions)} ${lists(p.themes)} ${lists(p.themeTags)} ${lists(p.forWhom)}`;
    const desc = (p.shortDesc ?? "").toLowerCase();
    const flav = lists(p.flavours);

    let hits = 0;
    let score = name.includes(q) ? 120 : 0;
    for (const w of words) {
      const wordRe = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
      let best = 0;
      if (wordRe.test(name)) best = 40;
      else if (name.includes(w)) best = 28;
      else if (cat.includes(w)) best = 20;
      else if (tags.includes(w)) best = 16;
      else if (desc.includes(w)) best = 10;
      else if (flav.includes(w)) best = 3;
      if (best) hits++;
      score += best;
    }
    if (p.isBestseller) score += 2;
    return { id: p.id, hits, score, name, strong: score - (p.isBestseller ? 2 : 0) > 3 * hits };
  });

  // Cakes that merely *can* be ordered in the flavour only pad the list when
  // nothing is actually named or tagged that way.
  const anyStrong = scored.some((s) => s.strong);
  const kept = anyStrong ? scored.filter((s) => s.strong) : scored;
  kept.sort((a, b) => b.hits - a.hits || b.score - a.score || a.name.localeCompare(b.name));
  return kept.map((s) => s.id);
}

/** Load full rows for a page of ids, keeping the ranked order. */
export async function productsByIds<T extends { id: string }>(
  ids: string[],
  load: (ids: string[]) => Promise<T[]>,
): Promise<T[]> {
  if (!ids.length) return [];
  const rows = await load(ids);
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter((r): r is T => Boolean(r));
}
