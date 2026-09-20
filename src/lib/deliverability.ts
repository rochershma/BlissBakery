/**
 * Whether an outlet will deliver to a given address, and what it charges.
 *
 * Two rules, in order of confidence:
 *   1. Distance, when both the outlet and the address have coordinates. This is
 *      what the Google Places lookup gives us and it is the honest answer.
 *   2. Pincode allow-list, as a fallback for addresses saved before we had
 *      coordinates, or when the outlet has no map location set yet.
 *
 * An outlet with neither a map location nor a pincode list delivers anywhere,
 * because refusing every order would be worse than trusting the shop.
 */

export type DeliveryTier = { maxKm: number; fee: number };

export type StoreDelivery = {
  name?: string | null;
  city?: string | null;
  pincode?: string | null;
  servicePincodes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deliveryRadius?: number | null;
  deliveryCharge?: number | null;
  deliveryTiers?: string | null;
};

export type AddressPoint = {
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type DeliveryCheck = {
  deliverable: boolean;
  fee: number;
  distanceKm: number | null;
  /** Customer-facing explanation, only set when not deliverable. */
  reason: string | null;
  basis: "distance" | "pincode" | "open";
};

const EARTH_KM = 6371;

export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function parseTiers(raw: string | null | undefined): DeliveryTier[] {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => typeof t?.maxKm === "number" && typeof t?.fee === "number")
      .sort((a, b) => a.maxKm - b.maxKm);
  } catch {
    return [];
  }
}

export function servedPincodes(store: StoreDelivery): string[] {
  const extra = (store.servicePincodes ?? "").split(",").map((p) => p.trim());
  return [...new Set([store.pincode ?? "", ...extra].filter(Boolean))];
}

export function checkDelivery(store: StoreDelivery, address: AddressPoint): DeliveryCheck {
  const flatFee = store.deliveryCharge ?? 0;
  const where = store.name || store.city || "this outlet";

  const hasCoords =
    typeof store.latitude === "number" &&
    typeof store.longitude === "number" &&
    typeof address.latitude === "number" &&
    typeof address.longitude === "number";

  if (hasCoords) {
    const km = distanceKm(
      { latitude: store.latitude!, longitude: store.longitude! },
      { latitude: address.latitude!, longitude: address.longitude! },
    );
    const radius = store.deliveryRadius ?? 0;
    if (radius > 0 && km > radius) {
      return {
        deliverable: false,
        fee: 0,
        distanceKm: km,
        reason: `That's ${km.toFixed(1)} km from ${where}, which delivers up to ${radius} km.`,
        basis: "distance",
      };
    }
    const tiers = parseTiers(store.deliveryTiers);
    const tier = tiers.find((t) => km <= t.maxKm);
    return {
      deliverable: true,
      fee: tier ? tier.fee : flatFee,
      distanceKm: km,
      reason: null,
      basis: "distance",
    };
  }

  const served = servedPincodes(store);
  if (served.length > 0) {
    const pin = (address.pincode ?? "").trim();
    if (!served.includes(pin)) {
      return {
        deliverable: false,
        fee: 0,
        distanceKm: null,
        reason: `${where} doesn't deliver to ${pin || "that pincode"} yet. It serves ${served.join(", ")}.`,
        basis: "pincode",
      };
    }
    return { deliverable: true, fee: flatFee, distanceKm: null, reason: null, basis: "pincode" };
  }

  return { deliverable: true, fee: flatFee, distanceKm: null, reason: null, basis: "open" };
}
