import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/server-utils";
import { getActiveStoreId } from "@/lib/active-store";
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
  const store = await db.store.findFirst({ where: { id: await getActiveStoreId() ?? undefined } });
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
  // Middleware guards /api/admin, but authorisation should not depend on a
  // single path matcher — re-check it where the write actually happens.
  await requireAdmin();

  const body = await req.json();
  const store = await db.store.findFirst({ where: { id: await getActiveStoreId() ?? undefined } });
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
  
  const updateData: Record<string, unknown> = {};
  if (body.flavours !== undefined) {
    const names = Array.isArray(body.flavours) ? body.flavours.filter((f: unknown) => typeof f === "string" && f.trim()).map((f: string) => f.trim().slice(0, 50)) : [];
    updateData.defaultFlavours = JSON.stringify(names);
  }
  if (body.flavourPrices !== undefined) {
    // Drop anything without a name or a positive price so pricing maths can't produce NaN.
    const prices = Array.isArray(body.flavourPrices)
      ? body.flavourPrices.filter((p: { name?: unknown; price500g?: unknown }) => p && typeof p.name === "string" && p.name.trim() && Number.isFinite(Number(p.price500g)) && Number(p.price500g) > 0)
        .map((p: { name: string; price500g: number }) => ({ name: p.name.trim().slice(0, 50), price500g: Math.round(Number(p.price500g)) }))
      : [];
    updateData.defaultFlavourPrices = JSON.stringify(prices);
  }
  if (body.customSizes !== undefined) {
    const sizes = Array.isArray(body.customSizes)
      ? body.customSizes.filter((s: { kg?: unknown; name?: unknown }) => s && Number.isFinite(Number(s.kg)) && Number(s.kg) > 0 && typeof s.name === "string" && s.name.trim())
        .map((s: { kg: number; name: string; serves?: string }) => ({ kg: Number(s.kg), name: s.name.trim().slice(0, 30), serves: typeof s.serves === "string" ? s.serves.slice(0, 40) : "" }))
      : [];
    updateData.defaultCustomSizes = JSON.stringify(sizes);
  }
  if (body.defaultBase500gPrice !== undefined) {
    updateData.defaultBase500gPrice = Math.max(1, Number(body.defaultBase500gPrice) || 300);
  }
  
  await db.store.update({ where: { id: store.id }, data: updateData });
  
  return NextResponse.json({ success: true });
}
