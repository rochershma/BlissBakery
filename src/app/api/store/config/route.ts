import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseSlots } from "@/lib/slots";
import { getCustomerStoreId } from "@/lib/customer-store";

export async function GET() {
  const store = await db.store.findFirst({
    where: { id: await getCustomerStoreId() },
    select: {
      pincode: true,
      city: true,
      packagingCharge: true,
      deliveryCharge: true,
      minDeliveryOrder: true,
      deliveryRadius: true,
      gstRate: true,
      servicePincodes: true,
      logo: true,
      deliveryTiers: true,
      deliverySlots: true,
      addOnMaxQty: true,
      orderLeadHours: true,
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
    servicePincodes: [
      ...new Set([store.pincode, ...(store.servicePincodes ?? "").split(",").map((p) => p.trim())].filter(Boolean)),
    ],
    packagingCharge: store.packagingCharge ?? 15,
    deliveryCharge: store.deliveryCharge ?? 30,
    minDeliveryOrder: store.minDeliveryOrder ?? 200,
    deliveryRadius: store.deliveryRadius ?? 10,
    gstRate: store.gstRate ?? 0,
    logo: store.logo || "/uploads/branding/logo.png",
    deliveryTiers,
    deliverySlots: parseSlots(store.deliverySlots),
    addOnMaxQty: Math.max(1, store.addOnMaxQty ?? 20),
    orderLeadHours: Math.max(0, store.orderLeadHours ?? 4),
    storeLat: store.latitude ?? 27.1517,
    storeLng: store.longitude ?? 74.8560,
    addOnImages: Object.fromEntries(addOns.filter(a => a.image).map(a => [a.name, a.image])),
    addOns,
  });
}
