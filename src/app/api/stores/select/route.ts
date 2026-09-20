import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STORE_COOKIE } from "@/lib/customer-store";

/** Remembers which outlet the customer is shopping at. */
export async function POST(req: NextRequest) {
  const { slug } = await req.json().catch(() => ({ slug: null }));

  const store = typeof slug === "string"
    ? await db.store.findFirst({ where: { slug, isOpen: true }, select: { slug: true } })
    : null;

  if (!store) {
    return NextResponse.json({ success: false, message: "Store not available" }, { status: 400 });
  }

  const res = NextResponse.json({ success: true, slug: store.slug });
  res.cookies.set(STORE_COOKIE, store.slug, {
    sameSite: "lax",
    maxAge: 180 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
