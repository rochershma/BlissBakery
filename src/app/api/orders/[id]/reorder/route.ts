import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { firstImage } from "@/lib/img";

/**
 * Rebuilds a past order as a cart payload.
 *
 * Prices and availability are read fresh, because a cake bought last month may
 * have changed price or been taken off the menu since.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    select: {
      userId: true,
      store: { select: { slug: true } },
      items: {
        select: {
          productName: true,
          variantName: true,
          quantity: true,
          flavour: true,
          cakeMessage: true,
          product: {
            select: {
              id: true, slug: true, name: true, images: true, basePrice: true, isAvailable: true,
              variants: { select: { name: true, price: true, isAvailable: true } },
            },
          },
        },
      },
    },
  });

  if (!order || order.userId !== session.userId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const items = [];
  const unavailable: string[] = [];

  for (const line of order.items) {
    const p = line.product;
    if (!p || !p.isAvailable) {
      unavailable.push(line.productName);
      continue;
    }

    const variant = line.variantName
      ? p.variants.find((v) => v.name === line.variantName && v.isAvailable)
      : null;

    if (line.variantName && !variant) {
      unavailable.push(`${line.productName} (${line.variantName})`);
      continue;
    }

    items.push({
      productId: p.id,
      productSlug: p.slug,
      name: p.name,
      image: firstImage(p.images) ?? undefined,
      variantName: variant?.name,
      unitPrice: variant?.price ?? p.basePrice,
      quantity: line.quantity,
      flavour: line.flavour ?? undefined,
      cakeMessage: line.cakeMessage ?? undefined,
      addOns: [],
    });
  }

  return NextResponse.json({ items, unavailable, storeSlug: order.store?.slug ?? null });
}
