import { db } from "@/lib/db";
import { fromPrice, parseWeightKg, type FlavourPrice } from "@/lib/pricing";
import { firstImage } from "@/lib/img";
import { parseJsonSafe } from "@/lib/utils";
import type { FilterGroup } from "@/components/v5/collection";

export type Row = Awaited<ReturnType<typeof loadProducts>>[number];

const SELECT = {
  id: true, name: true, slug: true, images: true, basePrice: true, mrpPrice: true,
  isBestseller: true, isNew: true, createdAt: true, pricingStrategy: true,
  designCharge: true, base500gPrice: true, flavourPrices: true, flavours: true,
  occasions: true, themeTags: true, forWhom: true, servingInfo: true,
  category: { select: { slug: true, name: true } },
  variants: { select: { name: true, price: true, isAvailable: true } },
} as const;

/**
 * Products belong to a store through their category, so every listing must pass
 * the store it is rendering — otherwise one store's menu shows another's cakes.
 */
export async function loadProducts(storeId: string, where: Record<string, unknown>, take = 400) {
  return db.product.findMany({
    where: { isAvailable: true, category: { storeId }, ...where },
    select: SELECT,
    take,
  });
}

export function toCards(rows: Row[], menuHref: string) {
  return rows.map((p) => {
    const flavourPrices = parseJsonSafe<FlavourPrice[]>(p.flavourPrices, []);
    const price = fromPrice(
      { pricingStrategy: p.pricingStrategy, basePrice: p.basePrice, designCharge: p.designCharge, base500gPrice: p.base500gPrice, flavourPrices },
      p.variants,
    );
    const tags = [
      ...parseJsonSafe<string[]>(p.occasions, []),
      ...parseJsonSafe<string[]>(p.themeTags, []),
      ...parseJsonSafe<string[]>(p.forWhom, []),
      ...(p.category?.slug ? [p.category.slug] : []),
    ];
    return {
      name: p.name,
      href: `${menuHref}/${p.slug}`,
      image: firstImage(p.images),
      price,
      isFrom: p.pricingStrategy === "CUSTOM",
      isBestseller: p.isBestseller,
      isNew: p.isNew,
      sub: p.servingInfo,
      _price: price,
      _tags: tags,
      _kg: p.variants.filter((v) => v.isAvailable !== false).map((v) => parseWeightKg(v.name)),
      _flav: parseJsonSafe<string[]>(p.flavours, []),
      _new: new Date(p.createdAt).getTime(),
    };
  });
}

const PRICE_BANDS = [
  { value: "0-700", label: "Under ₹700" },
  { value: "700-1200", label: "₹700 – ₹1,200" },
  { value: "1200-2000", label: "₹1,200 – ₹2,000" },
  { value: "2000-99999", label: "₹2,000+" },
];

const SIZES = [
  { value: "0.5", label: "500 g" }, { value: "1", label: "1 kg" },
  { value: "1.5", label: "1.5 kg" }, { value: "2", label: "2 kg" },
  { value: "3", label: "3 kg" }, { value: "4", label: "4 kg+" },
];

const SHAPES = [
  { value: "heart-shape", label: "Heart" }, { value: "1-tier", label: "1 tier" },
  { value: "2-tier", label: "2 tier" }, { value: "3-tier", label: "3 tier" },
];

/** Filters are contextual to how the shopper arrived. */
export function buildGroups(opts: { flavours: string[]; withShape?: boolean; extra?: FilterGroup[] }): FilterGroup[] {
  const groups: FilterGroup[] = [...(opts.extra ?? [])];
  groups.push({ key: "price", label: "Price", type: "check", options: PRICE_BANDS });
  groups.push({ key: "size", label: "Size", type: "pill", options: SIZES });
  if (opts.flavours.length) {
    groups.push({
      key: "flavour",
      label: "Flavour",
      type: "check",
      options: opts.flavours.slice(0, 14).map((f) => ({ value: f, label: f })),
    });
  }
  if (opts.withShape) groups.push({ key: "shape", label: "Tier & shape", type: "pill", options: SHAPES });
  return groups;
}

export async function storeFlavours(): Promise<string[]> {
  const s = await db.store.findFirst({ select: { defaultFlavours: true } });
  return parseJsonSafe<string[]>(s?.defaultFlavours, []);
}
