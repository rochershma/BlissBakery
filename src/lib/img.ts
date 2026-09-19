/** Content-aware Cloudinary crops. Local files pass through untouched. */
const CLOUD = "res.cloudinary.com";

export function img(src: string | null | undefined, w: number, h: number = w): string {
  if (!src) return "";
  if (!src.includes(CLOUD)) return src;
  const t = `w_${w},h_${h},c_fill,g_auto,q_auto:good,f_auto`;
  return src.replace("/image/upload/", `/image/upload/${t}/`);
}

/** Same as `img` but preserves aspect ratio instead of cropping — for banners. */
export function imgFit(src: string | null | undefined, w: number): string {
  if (!src) return "";
  if (!src.includes(CLOUD)) return src;
  return src.replace("/image/upload/", `/image/upload/w_${w},c_limit,q_auto:good,f_auto/`);
}

export function firstImage(json: string | null | undefined): string | null {
  if (!json) return null;
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) && arr.length ? arr[0] : null;
  } catch {
    return typeof json === "string" && json.startsWith("http") ? json : null;
  }
}

export function allImages(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}
