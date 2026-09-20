import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCustomerStoreId } from "@/lib/customer-store";
import { checkDelivery } from "@/lib/deliverability";

/**
 * Can the outlet the customer is browsing deliver here, and for how much?
 *
 * Checkout asks this for every saved address so the answer is visible before
 * anyone commits to a slot.
 */
export async function GET(req: NextRequest) {
  const store = await db.store.findFirst({
    where: { id: await getCustomerStoreId() },
    select: {
      name: true, city: true, pincode: true, servicePincodes: true,
      latitude: true, longitude: true, deliveryRadius: true,
      deliveryCharge: true, deliveryTiers: true, minDeliveryOrder: true,
    },
  });
  if (!store) return NextResponse.json({ message: "No outlet selected" }, { status: 404 });

  const params = req.nextUrl.searchParams;
  const addressId = params.get("addressId");

  let point = {
    pincode: params.get("pincode"),
    latitude: params.get("lat") ? Number(params.get("lat")) : null,
    longitude: params.get("lng") ? Number(params.get("lng")) : null,
  };

  if (addressId) {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Login required" }, { status: 401 });
    const saved = await db.address.findFirst({
      where: { id: addressId, userId: session.userId },
      select: { pincode: true, latitude: true, longitude: true },
    });
    if (!saved) return NextResponse.json({ message: "Address not found" }, { status: 404 });
    point = saved;
  }

  const result = checkDelivery(store, point);
  return NextResponse.json({
    ...result,
    minOrder: store.minDeliveryOrder ?? 0,
    storeName: store.name,
  });
}
