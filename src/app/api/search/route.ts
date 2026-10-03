import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getCustomerStoreId } from "@/lib/customer-store";
import { cleanQuery, productsByIds, searchProductIds } from "@/lib/search";
import { cardPrice } from "@/lib/pricing";
import { firstImage } from "@/lib/img";

/** Typeahead suggestions — same ranking as the search page, top 12. */
export async function GET(request: NextRequest) {
  const q = cleanQuery(request.nextUrl.searchParams.get("q"));
  if (q.length < 2) return NextResponse.json({ results: [] });

  // Suggestions must stay within the store the customer is shopping in.
  const storeSlug = request.nextUrl.searchParams.get("store");
  const store = storeSlug
    ? await db.store.findUnique({ where: { slug: storeSlug }, select: { id: true, slug: true } })
    : await db.store.findFirst({ where: { id: await getCustomerStoreId() }, select: { id: true, slug: true } });
  if (!store) return NextResponse.json({ results: [] });

  const ids = (await searchProductIds(store.id, q)).slice(0, 12);
  const rows = await productsByIds(ids, (page) => db.product.findMany({
    where: { id: { in: page } },
    include: { category: { select: { name: true } }, variants: { where: { isAvailable: true } } },
  }));

  const results = rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    storeSlug: store.slug,
    basePrice: cardPrice(p),
    image: firstImage(p.images),
    categoryName: p.category.name,
  }));

  return NextResponse.json({ results });
}
