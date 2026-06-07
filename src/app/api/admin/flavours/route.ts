import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const DEFAULT_SIZES = [
  { kg: 0.5, name: "0.5 Kg", serves: "Serves 4-6" },
  { kg: 1, name: "1 Kg", serves: "Serves 8-10" },
  { kg: 1.5, name: "1.5 Kg", serves: "Serves 12-15" },
  { kg: 2, name: "2 Kg", serves: "Serves 18-20" },
  { kg: 2.5, name: "2.5 Kg", serves: "Serves 22-25" },
  { kg: 3, name: "3 Kg", serves: "Serves 28-30" },
  { kg: 4, name: "4 Kg", serves: "Serves 35-40" },
  { kg: 5, name: "5 Kg", serves: "Serves 45-50" },
];

// GET default flavours, flavour prices, and custom sizes
export async function GET() {
  const store = await db.store.findFirst();
  if (!store) return NextResponse.json({ flavours: [], flavourPrices: [], customSizes: DEFAULT_SIZES });
  
  let flavours: string[] = [];
  let flavourPrices: { name: string; price500g: number }[] = [];
  let customSizes = DEFAULT_SIZES;
  try { flavours = store.defaultFlavours ? JSON.parse(store.defaultFlavours) : []; } catch {}
  try { flavourPrices = store.defaultFlavourPrices ? JSON.parse(store.defaultFlavourPrices) : []; } catch {}
  try { customSizes = store.defaultCustomSizes ? JSON.parse(store.defaultCustomSizes) : DEFAULT_SIZES; } catch {}
  
  return NextResponse.json({ flavours, flavourPrices, customSizes, defaultBase500gPrice: store.defaultBase500gPrice ?? 300 });
}

// PUT — save default flavours, prices, and sizes
export async function PUT(req: Request) {
  const body = await req.json();
  const store = await db.store.findFirst();
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
  
  const updateData: Record<string, unknown> = {};
  if (body.flavours !== undefined) updateData.defaultFlavours = JSON.stringify(body.flavours);
  if (body.flavourPrices !== undefined) updateData.defaultFlavourPrices = JSON.stringify(body.flavourPrices);
  if (body.customSizes !== undefined) updateData.defaultCustomSizes = JSON.stringify(body.customSizes);
  if (body.defaultBase500gPrice !== undefined) updateData.defaultBase500gPrice = Number(body.defaultBase500gPrice) || 300;
  
  await db.store.update({ where: { id: store.id }, data: updateData });
  
  return NextResponse.json({ success: true });
}
