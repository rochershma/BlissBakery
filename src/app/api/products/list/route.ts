import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const occasion = sp.get("occasion");
  const theme = sp.get("theme");
  const forWhom = sp.get("for");
  const tag = sp.get("tag");
  const query = sp.get("q")?.trim().replace(/[^\w\s\-&']/gi, "").substring(0, 50);
  const offset = Math.max(0, parseInt(sp.get("offset") || "0", 10));
  const limit = Math.min(24, Math.max(1, parseInt(sp.get("limit") || "12", 10)));

  // Build where clause
  const where: any = { isAvailable: true };
  if (occasion) {
    where.occasions = { contains: `"${occasion}"` };
    if (forWhom) where.forWhom = { contains: `"${forWhom}"` };
  }
  if (theme) {
    where.themes = { contains: `"${theme}"` };
    if (tag) where.themeTags = { contains: `"${tag}"` };
  }
  if (query) {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
    const orConds: any[] = [];
    for (const word of words) {
      orConds.push({ name: { contains: word } }, { shortDesc: { contains: word } }, { category: { name: { contains: word } } });
    }
    orConds.push({ name: { contains: query } });
    where.OR = orConds;
  }

  const products = await db.product.findMany({
    where,
    include: {
      category: true,
      variants: { where: { isAvailable: true }, orderBy: { price: "asc" as const }, take: 1 },
    },
    orderBy: [{ isBestseller: "desc" as const }, { isFeatured: "desc" as const }, { name: "asc" as const }],
    skip: offset,
    take: limit,
  });

  const items = products.map((p) => {
    let image: string | null = null;
    try {
      const imgs = JSON.parse(p.images || "[]");
      image = Array.isArray(imgs) ? imgs[0] || null : null;
    } catch { /* */ }
    const available = p.variants.filter(v => v.isAvailable !== false);
    const displayPrice = available.length > 0 ? Math.min(...available.map(v => v.price)) : p.basePrice;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      displayPrice,
      mrpPrice: p.mrpPrice,
      image,
      images: (() => { try { return JSON.parse(p.images || "[]"); } catch { return []; } })(),
      categoryName: p.category.name,
      isBestseller: p.isBestseller,
      isNew: p.isNew,
    };
  });

  return NextResponse.json({ items });
}
