/**
 * v5 pricing — mirrors the production formula used by the admin editor,
 * /api/cart/verify-prices and /api/orders/create. Never trust the client:
 * these helpers are for display only, the server always recomputes.
 */

export type FlavourPrice = { name: string; price500g: number };

export const DEFAULT_BASE_500G = 300;

/** price = flavour₅₀₀g × kg × 2 + designCharge */
export function customPrice(flavour500g: number, weightKg: number, designCharge: number): number {
  return Math.round(flavour500g * weightKg * 2 + designCharge);
}

/** Parse "1.5 Kg" / "500 g" / "0.5kg" into kilograms. */
export function parseWeightKg(name: string): number {
  const m = name.match(/([\d.]+)\s*(kg|g\b|gm|gram)/i);
  if (!m) return 0.5;
  const n = parseFloat(m[1]);
  if (!isFinite(n)) return 0.5;
  return /kg/i.test(m[2]) ? n : n / 1000;
}

export type PricingInput = {
  pricingStrategy?: string | null;
  basePrice: number;
  designCharge?: number | null;
  base500gPrice?: number | null;
  flavourPrices?: FlavourPrice[] | null;
};

/** Resolve the unit price for a given flavour + variant. */
export function resolveUnitPrice(
  product: PricingInput,
  flavour: string | null | undefined,
  variant: { name: string; price: number } | null | undefined,
): number {
  const isCustom = product.pricingStrategy === "CUSTOM";
  if (!isCustom || !flavour) return variant ? variant.price : product.basePrice;

  const fp = (product.flavourPrices ?? []).find((f) => f.name === flavour);
  const per500 = fp?.price500g ?? product.base500gPrice ?? DEFAULT_BASE_500G;
  const kg = variant ? parseWeightKg(variant.name) : 0.5;
  return customPrice(per500, kg, product.designCharge ?? 0);
}

/** The "from" price shown on cards — cheapest flavour at the smallest size. */
export function fromPrice(product: PricingInput, variants: { name: string; price: number; isAvailable?: boolean }[]): number {
  const avail = variants.filter((v) => v.isAvailable !== false);
  if (product.pricingStrategy === "CUSTOM" && product.flavourPrices?.length) {
    const cheapest = Math.min(...product.flavourPrices.map((f) => f.price500g));
    const smallest = avail.length ? Math.min(...avail.map((v) => parseWeightKg(v.name))) : 0.5;
    return customPrice(cheapest, smallest, product.designCharge ?? 0);
  }
  if (avail.length) return Math.min(...avail.map((v) => v.price));
  return product.basePrice;
}

/** Serves label from a weight, used when a variant has no `serves` set. */
export function servesFor(kg: number): string {
  const table: [number, string][] = [
    [0.5, "4–6"], [1, "8–10"], [1.5, "12–15"], [2, "18–20"],
    [2.5, "22–25"], [3, "28–30"], [3.5, "32–35"], [4, "35–40"],
    [5, "45–50"], [6, "50–60"],
  ];
  const hit = table.find(([k]) => Math.abs(k - kg) < 0.01);
  return hit ? hit[1] : `${Math.round(kg * 9)}+`;
}
