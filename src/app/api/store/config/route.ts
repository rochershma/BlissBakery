import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const store = await db.store.findFirst({
    select: {
      pincode: true,
      city: true,
      packagingCharge: true,
      deliveryCharge: true,
      minDeliveryOrder: true,
      deliveryRadius: true,
      gstRate: true,
      logo: true,
      deliveryTiers: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const addOns = await db.storeAddOn.findMany({
    where: { isActive: true },
    select: { id: true, name: true, price: true, image: true, category: true },
    orderBy: { sortOrder: "asc" },
  });

  let deliveryTiers = [
    { maxKm: 3, fee: 0 },
    { maxKm: 6, fee: 30 },
    { maxKm: 10, fee: 50 },
  ];
  try {
    if (store.deliveryTiers) deliveryTiers = JSON.parse(store.deliveryTiers);
  } catch {}

  return NextResponse.json({
    pincode: store.pincode || "341508",
    city: store.city || "Kuchaman City",
    packagingCharge: store.packagingCharge ?? 15,
    deliveryCharge: store.deliveryCharge ?? 30,
    minDeliveryOrder: store.minDeliveryOrder ?? 200,
    deliveryRadius: store.deliveryRadius ?? 10,
    gstRate: store.gstRate ?? 0,
    logo: store.logo || "/uploads/branding/logo.png",
    deliveryTiers,
    storeLat: store.latitude ?? 27.1517,
    storeLng: store.longitude ?? 74.8560,
    addOnImages: Object.fromEntries(addOns.filter(a => a.image).map(a => [a.name, a.image])),
    addOns,
  });
}
