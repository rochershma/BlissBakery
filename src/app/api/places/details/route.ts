import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { pickParts, mapsKey } from "@/lib/places";

/** Resolves a chosen prediction into a saveable address. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Login required" }, { status: 401 });

  if (!rateLimit(`place-details:${session.userId}`, 40, 60_000).allowed) {
    return NextResponse.json({ message: "Slow down a moment" }, { status: 429 });
  }

  const key = mapsKey();
  if (!key) return NextResponse.json({ unavailable: true }, { status: 503 });

  const placeId = req.nextUrl.searchParams.get("placeId");
  const sessionToken = req.nextUrl.searchParams.get("sessionToken");
  if (!placeId || !/^[\w-]{10,200}$/.test(placeId)) {
    return NextResponse.json({ message: "Unknown place" }, { status: 400 });
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  url.searchParams.set("languageCode", "en");
  url.searchParams.set("regionCode", "in");
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);

  try {
    const r = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "id,formattedAddress,shortFormattedAddress,location,addressComponents",
      },
    });
    if (!r.ok) return NextResponse.json({ unavailable: true }, { status: 502 });

    const place = await r.json();
    return NextResponse.json({
      placeId: place.id ?? placeId,
      fullAddress: place.shortFormattedAddress || place.formattedAddress || "",
      latitude: place.location?.latitude ?? null,
      longitude: place.location?.longitude ?? null,
      ...pickParts(place.addressComponents),
    });
  } catch {
    return NextResponse.json({ unavailable: true }, { status: 502 });
  }
}
