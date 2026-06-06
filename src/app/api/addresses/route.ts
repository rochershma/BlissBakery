import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ addresses: [] });

  const addresses = await db.address.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { label, fullAddress, landmark, city, state, pincode, latitude, longitude } = body;

  if (!fullAddress?.trim() || !pincode?.trim()) {
    return NextResponse.json({ error: "Address and pincode are required" }, { status: 400 });
  }

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "Invalid pincode" }, { status: 400 });
  }

  // Sanitize
  const sanitize = (s: string | undefined) => s?.replace(/<[^>]*>/g, "").trim() || null;

  const address = await db.address.create({
    data: {
      userId: session.userId,
      label: sanitize(label) || "Home",
      fullAddress: sanitize(fullAddress)!,
      landmark: sanitize(landmark),
      city: sanitize(city),
      state: sanitize(state),
      pincode: pincode.trim(),
      latitude: typeof latitude === "number" ? latitude : null,
      longitude: typeof longitude === "number" ? longitude : null,
    },
  });

  return NextResponse.json({ address }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.address.deleteMany({ where: { id, userId: session.userId } });
  return NextResponse.json({ ok: true });
}
