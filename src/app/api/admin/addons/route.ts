import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) return null;
  return user;
}

// CREATE
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const store = await db.store.findFirst();
  if (!store) return NextResponse.json({ error: "No store" }, { status: 404 });

  const { name, price, category, image } = await req.json();
  if (!name?.trim() || !price) return NextResponse.json({ error: "Name and price required" }, { status: 400 });

  const sanitizedName = name.trim().substring(0, 100);
  const maxOrder = await db.storeAddOn.aggregate({ where: { storeId: store.id }, _max: { sortOrder: true } });

  const addon = await db.storeAddOn.create({
    data: {
      name: sanitizedName,
      price: parseFloat(price),
      category: category || "DECORATION",
      image: image || null,
      sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      storeId: store.id,
    },
  });

  return NextResponse.json({ addon: { ...addon } });
}

// UPDATE
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Sanitize
  const data: Record<string, unknown> = {};
  if (updates.name !== undefined) data.name = String(updates.name).trim().substring(0, 100);
  if (updates.price !== undefined) data.price = parseFloat(updates.price);
  if (updates.category !== undefined) data.category = updates.category;
  if (updates.image !== undefined) data.image = updates.image;
  if (updates.isActive !== undefined) data.isActive = Boolean(updates.isActive);
  if (updates.sortOrder !== undefined) data.sortOrder = parseInt(updates.sortOrder);

  const addon = await db.storeAddOn.update({ where: { id }, data });
  return NextResponse.json({ addon });
}

// DELETE
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.storeAddOn.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
