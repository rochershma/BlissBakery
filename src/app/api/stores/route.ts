import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Storefront store picker: only stores a customer can actually order from. */
export async function GET() {
  const stores = await db.store.findMany({
    where: { isOpen: true },
    select: { id: true, name: true, slug: true, city: true, pincode: true, address: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ stores });
}
