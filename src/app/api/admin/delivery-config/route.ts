import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET delivery config
export async function GET() {
  const store = await db.store.findFirst({
    select: {
      gstRate: true,
      packagingCharge: true,
      deliveryCharge: true,
      deliveryRadius: true,
      minDeliveryOrder: true,
      deliveryTiers: true,
      latitude: true,
      longitude: true,
    },
  });
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  let tiers = [
    { maxKm: 3, fee: 0 },
    { maxKm: 6, fee: 30 },
    { maxKm: 10, fee: 50 },
  ];
  try {
    if (store.deliveryTiers) tiers = JSON.parse(store.deliveryTiers);
  } catch {}

  return NextResponse.json({
    gstRate: store.gstRate ?? 0,
    packagingCharge: store.packagingCharge ?? 15,
    deliveryCharge: store.deliveryCharge ?? 30,
    deliveryRadius: store.deliveryRadius ?? 10,
    minDeliveryOrder: store.minDeliveryOrder ?? 200,
    deliveryTiers: tiers,
    storeLat: store.latitude ?? 27.1517,
    storeLng: store.longitude ?? 74.8560,
  });
}

// PUT delivery config
export async function PUT(req: Request) {
  const data = await req.json();
  const store = await db.store.findFirst();
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};

  if (data.gstRate !== undefined) updateData.gstRate = Math.max(0, Number(data.gstRate) || 0);
  if (data.packagingCharge !== undefined) updateData.packagingCharge = Math.max(0, Number(data.packagingCharge) || 0);
  if (data.deliveryCharge !== undefined) updateData.deliveryCharge = Math.max(0, Number(data.deliveryCharge) || 0);
  if (data.deliveryRadius !== undefined) updateData.deliveryRadius = Math.max(0, Number(data.deliveryRadius) || 0);
  if (data.minDeliveryOrder !== undefined) updateData.minDeliveryOrder = Math.max(0, Number(data.minDeliveryOrder) || 0);
  if (data.deliveryTiers !== undefined) {
    if (!Array.isArray(data.deliveryTiers)) return NextResponse.json({ error: "deliveryTiers must be an array" }, { status: 400 });
    updateData.deliveryTiers = JSON.stringify(data.deliveryTiers);
  }

  await db.store.update({ where: { id: store.id }, data: updateData });

  return NextResponse.json({ success: true });
}
