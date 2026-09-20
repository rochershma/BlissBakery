import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCustomerStoreId } from "@/lib/customer-store";

const sanitize = (s: string | undefined) => s?.replace(/<[^>]*>/g, "").trim() || null;

type AddressInput = {
  label?: string;
  fullAddress?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: unknown;
  longitude?: unknown;
};

/**
 * Validates the shared address fields and, for delivery, that the pincode is one
 * the chosen outlet actually serves — the UI warns, but the API is what decides.
 */
async function validate(body: AddressInput) {
  const { fullAddress, pincode } = body;

  if (!fullAddress?.trim() || !pincode?.trim()) {
    return { error: "Address and pincode are required" };
  }
  if (!/^\d{6}$/.test(pincode.trim())) {
    return { error: "Enter a valid 6-digit pincode" };
  }

  const store = await db.store.findFirst({
    where: { id: await getCustomerStoreId() },
    select: { pincode: true, city: true, servicePincodes: true },
  });

  if (store) {
    const extra = (store.servicePincodes ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const served = new Set([store.pincode, ...extra].filter(Boolean));

    if (served.size > 0 && !served.has(pincode.trim())) {
      return {
        error: `We don't deliver to ${pincode.trim()} yet. ${store.city ?? "This outlet"} serves ${[...served].join(", ")}.`,
      };
    }
  }

  return {
    data: {
      label: sanitize(body.label) || "Home",
      fullAddress: sanitize(body.fullAddress)!,
      landmark: sanitize(body.landmark),
      city: sanitize(body.city),
      state: sanitize(body.state),
      pincode: pincode.trim(),
      latitude: typeof body.latitude === "number" ? body.latitude : null,
      longitude: typeof body.longitude === "number" ? body.longitude : null,
    },
  };
}

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

  const { error, data } = await validate(await req.json().catch(() => ({})));
  if (error) return NextResponse.json({ error }, { status: 400 });

  const address = await db.address.create({
    data: { userId: session.userId, ...data! },
  });

  return NextResponse.json({ address }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = req.nextUrl.searchParams.get("id") ?? body?.id;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { error, data } = await validate(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  // updateMany scopes by userId, so one customer cannot edit another's address.
  const { count } = await db.address.updateMany({
    where: { id, userId: session.userId },
    data: data!,
  });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const address = await db.address.findUnique({ where: { id } });
  return NextResponse.json({ address });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // The UI sends ?id=…; older callers sent a JSON body. Accept both.
  let id = req.nextUrl.searchParams.get("id");
  if (!id) {
    const body = await req.json().catch(() => null);
    id = body?.id ?? null;
  }
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { count } = await db.address.deleteMany({ where: { id, userId: session.userId } });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
