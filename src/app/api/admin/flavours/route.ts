import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET default flavours
export async function GET() {
  const store = await db.store.findFirst();
  if (!store) return NextResponse.json({ flavours: [] });
  
  let flavours: string[] = [];
  try {
    flavours = store.defaultFlavours ? JSON.parse(store.defaultFlavours) : [];
  } catch {
    flavours = [];
  }
  return NextResponse.json({ flavours });
}

// PUT — save default flavours
export async function PUT(req: Request) {
  const { flavours } = await req.json();
  if (!Array.isArray(flavours)) {
    return NextResponse.json({ error: "Invalid flavours array" }, { status: 400 });
  }
  
  const store = await db.store.findFirst();
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
  
  await db.store.update({
    where: { id: store.id },
    data: { defaultFlavours: JSON.stringify(flavours) },
  });
  
  return NextResponse.json({ success: true, flavours });
}
