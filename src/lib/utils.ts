import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  if (isNaN(price)) return "\u20b90";
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(price));
  return `\u20b9${formatted}`;
}

/** Compute display price from cheapest available variant, falling back to basePrice */
export function getDisplayPrice(product: { basePrice: number; variants?: { price: number; isAvailable?: boolean }[] }): number {
  const available = product.variants?.filter(v => v.isAvailable !== false) ?? [];
  if (available.length === 0) return product.basePrice;
  return Math.min(...available.map(v => v.price));
}

export function generateOrderNumber(prefix: string = "BB"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

export function parseJsonSafe<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
