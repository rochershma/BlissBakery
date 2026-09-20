export type GoogleComponent = { longText?: string; shortText?: string; types?: string[] };

/** Pulls the bits we store out of Google's address component list. */
export function pickParts(components: GoogleComponent[] | undefined) {
  const find = (type: string) => components?.find((c) => c.types?.includes(type));
  return {
    pincode: find("postal_code")?.longText ?? "",
    city:
      find("locality")?.longText ??
      find("administrative_area_level_3")?.longText ??
      find("administrative_area_level_2")?.longText ??
      "",
    state: find("administrative_area_level_1")?.longText ?? "",
  };
}

export function mapsKey() {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
}
