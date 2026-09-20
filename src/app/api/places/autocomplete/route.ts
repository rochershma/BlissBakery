import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCustomerStoreId } from "@/lib/customer-store";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Places Autocomplete, proxied so the Maps key never reaches the browser.
 *
 * Results are biased to the outlet the customer is ordering from, which is what
 * makes the first suggestion usually the right one.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ suggestions: [] }, { status: 401 });
  }

  const limited = rateLimit(`places:${session.userId}`, 60, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ suggestions: [], message: "Slow down a moment" }, { status: 429 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return NextResponse.json({ suggestions: [], unavailable: true });

  const { input, sessionToken } = await req.json().catch(() => ({ input: "" }));
  if (typeof input !== "string" || input.trim().length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const store = await db.store.findFirst({
    where: { id: await getCustomerStoreId() },
    select: { latitude: true, longitude: true, deliveryRadius: true },
  });

  const body: Record<string, unknown> = {
    input: input.trim().slice(0, 200),
    includedRegionCodes: ["in"],
    languageCode: "en",
    regionCode: "in",
  };
  if (typeof sessionToken === "string" && sessionToken) body.sessionToken = sessionToken;
  if (typeof store?.latitude === "number" && typeof store?.longitude === "number") {
    body.locationBias = {
      circle: {
        center: { latitude: store.latitude, longitude: store.longitude },
        // Bias, not restrict: a customer may legitimately search just outside
        // the delivery radius and we want to tell them so, not hide the place.
        radius: Math.min(50_000, Math.max(5_000, (store.deliveryRadius ?? 15) * 2 * 1000)),
      },
    };
    body.origin = { latitude: store.latitude, longitude: store.longitude };
  }

  try {
    const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.distanceMeters",
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) return NextResponse.json({ suggestions: [], unavailable: true });

    const data = await r.json();
    type Prediction = {
      placePrediction?: {
        placeId?: string;
        distanceMeters?: number;
        structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
      };
    };
    const suggestions = (data.suggestions ?? [])
      .map((s: Prediction) => s.placePrediction)
      .filter((p: Prediction["placePrediction"]) => p?.placeId)
      .map((p: NonNullable<Prediction["placePrediction"]>) => ({
        placeId: p.placeId,
        main: p.structuredFormat?.mainText?.text ?? "",
        secondary: p.structuredFormat?.secondaryText?.text ?? "",
        distanceKm: typeof p.distanceMeters === "number" ? p.distanceMeters / 1000 : null,
      }));

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [], unavailable: true });
  }
}
