import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { pickParts, mapsKey } from "@/lib/places";

/** Turns the browser's GPS fix into an address the customer can confirm. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Login required" }, { status: 401 });

  if (!rateLimit(`geocode:${session.userId}`, 20, 60_000).allowed) {
    return NextResponse.json({ message: "Slow down a moment" }, { status: 429 });
  }

  const key = mapsKey();
  if (!key) return NextResponse.json({ unavailable: true }, { status: 503 });

  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ message: "Invalid location" }, { status: 400 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("region", "in");
  url.searchParams.set("key", key);

  try {
    const r = await fetch(url);
    const data = await r.json();
    const best = data?.results?.[0];
    if (!best) return NextResponse.json({ unavailable: true }, { status: 404 });

    // The geocoding API still uses snake_case components; map them across.
    const components = (best.address_components ?? []).map(
      (c: { long_name?: string; short_name?: string; types?: string[] }) => ({
        longText: c.long_name,
        shortText: c.short_name,
        types: c.types,
      }),
    );

    return NextResponse.json({
      placeId: best.place_id ?? null,
      fullAddress: best.formatted_address ?? "",
      latitude: lat,
      longitude: lng,
      ...pickParts(components),
    });
  } catch {
    return NextResponse.json({ unavailable: true }, { status: 502 });
  }
}
