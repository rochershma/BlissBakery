import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/utils";
import { customPrice, parseWeightKg, DEFAULT_BASE_500G, type FlavourPrice } from "@/lib/pricing";
import { checkDelivery } from "@/lib/deliverability";
import { localIso, parseSlots, slotsForDate } from "@/lib/slots";
import { parseJsonSafe } from "@/lib/utils";
import { z } from "zod";

const sanitize = (s: string | undefined | null) => s?.replace(/<[^>]*>/g, "").trim() || null;

const schema = z.object({
  storeSlug: z.string(),
  orderType: z.enum(["PICKUP", "DELIVERY"]),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string().transform(s => s.replace(/<[^>]*>/g, "")),
    variantName: z.string().optional(),
    quantity: z.number().min(1).max(50),
    unitPrice: z.number(),
    addOns: z.array(z.object({ name: z.string(), price: z.number() })).optional(),
    flavour: z.string().max(50).optional(),
    cakeMessage: z.string().max(50).optional(),
    occasion: z.string().max(30).optional(),
    recipientName: z.string().max(30).optional(),
    recipientAge: z.string().max(3).optional(),
  })).min(1, "At least one item is required"),
  specialInstructions: z.string().max(500).optional(),
  promoCode: z.string().max(20).optional(),
  addressId: z.string().optional(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a delivery date"),
  deliverySlot: z.string().min(1, "Pick a delivery slot").max(30),
  // Basket-level add-ons from the outlet shelf, priced once per order (not per cake).
  extras: z.array(z.object({ name: z.string().max(60), quantity: z.number().int().min(1).max(50) })).max(20).optional(),
});

const MAX_DAYS_AHEAD = 30;

const bad = (message: string) => NextResponse.json({ success: false, message }, { status: 400 });

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Login required" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid order");
    const data = parsed.data;

    const store = await db.store.findUnique({ where: { slug: data.storeSlug } });
    if (!store) {
      return NextResponse.json({ success: false, message: "Store not found" }, { status: 404 });
    }
    if (!store.isOpen) {
      return NextResponse.json({ success: false, message: `${store.name} isn't taking orders right now` }, { status: 400 });
    }

    // The kitchen plans from date + slot, so both must be real and reachable.
    const today = localIso();
    const latest = new Date();
    latest.setDate(latest.getDate() + MAX_DAYS_AHEAD);
    if (data.deliveryDate < today) return bad("That date has passed — pick another day");
    if (data.deliveryDate > localIso(latest)) return bad(`We take orders up to ${MAX_DAYS_AHEAD} days ahead`);
    // Half an hour of grace for a customer who sat on the checkout page.
    const open = slotsForDate(parseSlots(store.deliverySlots), data.deliveryDate, Math.max(0, (store.orderLeadHours ?? 0) - 0.5));
    if (!open.some((s) => s.label === data.deliverySlot)) {
      return bad("That slot is no longer available — please pick another");
    }


    // Calculate totals — SERVER-SIDE price lookup (never trust client prices)
    let itemTotal = 0;
    const verifiedItems = [];
    // The shelf is per-outlet, so load it once rather than per item.
    const storeAddOns = await db.storeAddOn.findMany({ where: { storeId: store.id, isActive: true } });
    for (const item of data.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        include: { variants: true, addOns: true, category: { select: { storeId: true } } },
      });
      if (!product || !product.isAvailable) {
        return NextResponse.json({ success: false, message: `Product "${item.name}" is not available` }, { status: 400 });
      }
      // Each outlet has its own copy of the menu; an order must not mix them.
      if (product.category.storeId !== store.id) {
        return NextResponse.json(
          { success: false, message: `"${product.name}" isn't sold at ${store.name}. Empty your basket and pick it again.` },
          { status: 400 },
        );
      }
      // Determine correct price from DB. An unknown size or flavour is refused
      // rather than priced at the base rate — the kitchen would bake what was named.
      const variant = item.variantName
        ? product.variants.find((v) => v.name === item.variantName && v.isAvailable !== false)
        : null;
      if (item.variantName && !variant) return bad(`"${product.name}" isn't available in ${item.variantName}`);
      if (!item.variantName && product.variants.some((v) => v.isAvailable !== false)) {
        return bad(`Choose a size for "${product.name}"`);
      }

      const flavourPrices = parseJsonSafe<FlavourPrice[]>(product.flavourPrices, []);
      const flavourNames = new Set([
        ...parseJsonSafe<string[]>(product.flavours, []),
        ...flavourPrices.map((f) => f.name),
      ]);
      if (item.flavour && flavourNames.size && !flavourNames.has(item.flavour)) {
        return bad(`"${item.flavour}" isn't offered for "${product.name}"`);
      }

      let serverPrice = product.basePrice;
      if (product.pricingStrategy === "CUSTOM" && item.flavour) {
        const fp = flavourPrices.find(f => f.name === item.flavour);
        const flavour500g = fp?.price500g ?? product.base500gPrice ?? DEFAULT_BASE_500G;
        const weightKg = item.variantName ? parseWeightKg(item.variantName) : 0.5;
        serverPrice = customPrice(flavour500g, weightKg, product.designCharge ?? 0);
      } else if (variant) {
        serverPrice = variant.price;
      }
      // Add-ons are priced from the product or the store shelf; anything else is refused.
      const allVerifiedAddOns: { name: string; price: number }[] = [];
      for (const clientAddon of item.addOns || []) {
        const own = product.addOns.find(a => a.name === clientAddon.name && a.isAvailable);
        const shelf = storeAddOns.find(sa => sa.name === clientAddon.name);
        if (!own && !shelf) return bad(`"${clientAddon.name}" isn't available`);
        allVerifiedAddOns.push({ name: clientAddon.name, price: (own ?? shelf)!.price });
      }
      const perName = new Map<string, number>();
      for (const a of allVerifiedAddOns) perName.set(a.name, (perName.get(a.name) ?? 0) + 1);
      if ([...perName.values()].some((n) => n > Math.max(1, store.addOnMaxQty ?? 20))) {
        return bad(`Up to ${store.addOnMaxQty ?? 20} of each add-on per order`);
      }
      const addOnTotal = allVerifiedAddOns.reduce((s, a) => s + a.price, 0);
      itemTotal += (serverPrice + addOnTotal) * item.quantity;
      verifiedItems.push({ ...item, name: product.name, unitPrice: serverPrice, addOns: allVerifiedAddOns.length > 0 ? allVerifiedAddOns : undefined });
    }

    // Basket-level add-ons are charged once each, not multiplied by any cake's quantity.
    const extraMax = Math.max(1, store.addOnMaxQty ?? 20);
    const verifiedExtras: { name: string; price: number; quantity: number }[] = [];
    let extrasTotal = 0;
    for (const ex of data.extras ?? []) {
      const shelf = storeAddOns.find((sa) => sa.name === ex.name);
      if (!shelf) return bad(`"${ex.name}" isn't available`);
      if (ex.quantity > extraMax) return bad(`Up to ${extraMax} of each add-on per order`);
      verifiedExtras.push({ name: ex.name, price: shelf.price, quantity: ex.quantity });
      extrasTotal += shelf.price * ex.quantity;
    }
    itemTotal += extrasTotal;

    const packagingCharge = store.packagingCharge ?? 15;
    const gstRate = store.gstRate ?? 0;

    // Delivery: the address, the reachability and the fee are all decided here.
    // The browser only says which saved address it means.
    let deliveryCharge = 0;
    let deliveryAddress: string | null = null;

    if (data.orderType === "DELIVERY") {
      if (!data.addressId) {
        return NextResponse.json({ success: false, message: "Choose a delivery address" }, { status: 400 });
      }
      const address = await db.address.findFirst({
        where: { id: data.addressId, userId: session.userId },
      });
      if (!address) {
        return NextResponse.json({ success: false, message: "That address is no longer saved" }, { status: 400 });
      }

      const verdict = checkDelivery(store, address);
      if (!verdict.deliverable) {
        return NextResponse.json({ success: false, message: verdict.reason ?? "We can't deliver there" }, { status: 400 });
      }
      deliveryCharge = verdict.fee;

      const minOrder = store.minDeliveryOrder ?? 0;
      if (minOrder > 0 && itemTotal < minOrder) {
        return NextResponse.json(
          { success: false, message: `Delivery orders start at ₹${minOrder}. Add ₹${Math.ceil(minOrder - itemTotal)} more.` },
          { status: 400 },
        );
      }

      // Snapshot the text: the customer may edit or delete this address later,
      // but the order must keep saying where it actually went.
      deliveryAddress = [address.houseNo, address.fullAddress, address.landmark, address.city, address.pincode]
        .filter(Boolean)
        .join(", ");
    }

    // Apply promo discount — the same limits /api/promo/validate shows the customer.
    let discount = 0;
    let appliedPromo: { id: string; code: string } | null = null;
    if (data.promoCode) {
      // A store-specific code must not be redeemable at another store.
      const promo = await db.promoCode.findFirst({
        where: { code: data.promoCode.toUpperCase(), OR: [{ storeId: null }, { storeId: store.id }] },
      });
      const now = new Date();
      if (!promo || !promo.isActive || promo.validTo < now || (promo.validFrom && promo.validFrom > now)) {
        return bad("That promo code isn't valid any more \u2014 remove it to continue");
      }
      if (promo.minOrderValue && itemTotal < promo.minOrderValue) {
        return bad(`${promo.code} needs a minimum order of \u20b9${promo.minOrderValue}`);
      }
      const counted = { promoCode: promo.code, status: { not: "CANCELLED" } };
      if (promo.usageLimit && (await db.order.count({ where: counted })) >= promo.usageLimit) {
        return bad(`${promo.code} has been fully redeemed`);
      }
      if (promo.perUserLimit && (await db.order.count({ where: { ...counted, userId: session.userId } })) >= promo.perUserLimit) {
        return bad(`You've already used ${promo.code}`);
      }
      discount = promo.discountType === "PERCENTAGE"
        ? Math.min(itemTotal * (promo.discountValue / 100), promo.maxDiscount || Infinity)
        : promo.discountValue;
      discount = Math.round(Math.min(discount, itemTotal) * 100) / 100;
      appliedPromo = { id: promo.id, code: promo.code };
    }

    const taxableAmount = itemTotal + packagingCharge + deliveryCharge - discount;
    const tax = Math.round(taxableAmount * (gstRate / 100) * 100) / 100;
    const grandTotal = Math.round((taxableAmount + tax) * 100) / 100;

    // Expanded one-per-unit so the order and tracker can list each add-on.
    const extrasForDisplay = verifiedExtras.flatMap((e) => Array.from({ length: e.quantity }, () => ({ name: e.name, price: e.price })));

    // A double tap or a retried request must not bake the same cake twice.
    const recent = await db.order.findFirst({
      where: {
        userId: session.userId, storeId: store.id, orderType: data.orderType, deliveryAddress,
        deliverySlot: data.deliverySlot, grandTotal, createdAt: { gte: new Date(Date.now() - 20_000) },
      },
      include: { items: { select: { productId: true, quantity: true, variantName: true } } },
      orderBy: { createdAt: "desc" },
    });
    const sig = (xs: { productId: string | null; quantity: number; variantName?: string | null }[]) =>
      xs.map((x) => `${x.productId}:${x.variantName ?? ""}:${x.quantity}`).sort().join("|");
    if (recent && sig(recent.items) === sig(data.items)) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        order: { id: recent.id, orderNumber: recent.orderNumber, grandTotal: recent.grandTotal },
      });
    }

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber("BB"),
        userId: session.userId,
        storeId: store.id,
        orderType: data.orderType,
        deliveryAddress,
        deliveryDate: new Date(data.deliveryDate),
        deliverySlot: data.deliverySlot,
        specialInstructions: sanitize(data.specialInstructions),
        itemTotal,
        packagingCharge,
        deliveryCharge,
        discount,
        tax,
        grandTotal,
        promoCode: appliedPromo?.code ?? null,
        status: "PENDING",
        paymentStatus: "PENDING",
        items: {
          create: verifiedItems.map((item, idx) => {
            // Basket add-ons hang off the first line for display; their price is added once below.
            const lineAddOns = idx === 0 && extrasForDisplay.length
              ? [...(item.addOns || []), ...extrasForDisplay]
              : item.addOns || [];
            const cakeTotal = (item.unitPrice + (item.addOns || []).reduce((s, a) => s + a.price, 0)) * item.quantity;
            return {
              productId: item.productId,
              productName: sanitize(item.name) || item.name,
              variantName: item.variantName || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              addOns: lineAddOns.length ? JSON.stringify(lineAddOns) : null,
              totalPrice: idx === 0 ? cakeTotal + extrasTotal : cakeTotal,
              cakeMessage: sanitize(item.cakeMessage),
              flavour: sanitize(item.flavour),
              occasion: sanitize(item.occasion),
              recipientName: sanitize(item.recipientName),
              recipientAge: item.recipientAge?.replace(/\D/g, "") || null,
            };
          }),
        },
        statusHistory: {
          create: { status: "PENDING", note: "Order placed" },
        },
      },
    });

    if (appliedPromo) {
      await db.promoCode.update({ where: { id: appliedPromo.id }, data: { usedCount: { increment: 1 } } });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0].message }, { status: 400 });
    }
    console.error("Create order error:", error);
    return NextResponse.json({ success: false, message: "Failed to create order" }, { status: 500 });
  }
}
