import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  // Public: return active banners for storefront
  const store = await db.store.findFirst();
  if (!store) return NextResponse.json({ banners: [] });

  const banners = await db.banner.findMany({
    where: { storeId: store.id, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const store = await db.store.findFirst();
  if (!store) return NextResponse.json({ error: "No store" }, { status: 400 });

  const body = await req.json();
  const { title, mediaUrl, linkUrl, sortOrder } = body;

  if (!mediaUrl) return NextResponse.json({ error: "Image required" }, { status: 400 });

  const banner = await db.banner.create({
    data: {
      title: title || null,
      mediaUrl,
      linkUrl: linkUrl || null,
      sortOrder: sortOrder ?? 0,
      isActive: true,
      storeId: store.id,
    },
  });

  return NextResponse.json({ banner }, { status: 201 });
}
