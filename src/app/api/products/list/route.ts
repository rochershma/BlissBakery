import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { cleanQuery, productsByIds, searchProductIds } from "@/lib/search";
import { cardPrice } from "@/lib/pricing";
import { parseJsonSafe } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const occasion = sp.get("occasion");
  const theme = sp.get("theme");
  const forWhom = sp.get("for");
  const tag = sp.get("tag");
  const query = cleanQuery(sp.get("q"));
  const storeSlug = sp.get("store");
  const offset = Math.max(0, parseInt(sp.get("offset") || "0", 10));
  const limit = Math.min(24, Math.max(1, parseInt(sp.get("limit") || "12", 10)));

  // Products belong to a store via their category; default to the first store
  // so a caller can never be served another store's menu.
  const store = storeSlug
    ? await db.store.findUnique({ where: { slug: storeSlug }, select: { id: true } })
    : await db.store.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!store) return NextResponse.json({ items: [], total: 0 });

  // Build where clause
  const where: any = { isAvailable: true, category: { storeId: store.id } };
  if (occasion) {
    where.occasions = { contains: `"${occasion}"` };
    if (forWhom) where.forWhom = { contains: `"${forWhom}"` };
  }
  if (theme) {
    where.themes = { contains: `"${theme}"` };
    if (tag) where.themeTags = { contains: `"${tag}"` };
  }
  if (query) {
    // Same ranking as the first page the search route rendered.
    const ids = (await searchProductIds(store.id, query)).slice(offset, offset + limit);
    const ranked = await productsByIds(ids, (page) => db.product.findMany({
      where: { id: { in: page } },
      include: { category: true, variants: { where: { isAvailable: true } } },
    }));
    return NextResponse.json({ items: ranked.map(toItem) });
  }

  const products = await db.product.findMany({
    where,
    include: {
      category: true,
      variants: { where: { isAvailable: true }, orderBy: { price: "asc" as const } },
    },
    orderBy: [{ isBestseller: "desc" as const }, { isFeatured: "desc" as const }, { name: "asc" as const }],
    skip: offset,
    take: limit,
  });

  return NextResponse.json({ items: products.map(toItem) });
}

type Row = Prisma.ProductGetPayload<{ include: { category: true; variants: true } }>;

function toItem(p: Row) {
  const images = parseJsonSafe<string[]>(p.images, []);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    displayPrice: cardPrice(p),
    mrpPrice: p.mrpPrice,
    image: images[0] ?? null,
    images,
    categoryName: p.category.name,
    isBestseller: p.isBestseller,
    isNew: p.isNew,
  };
}
