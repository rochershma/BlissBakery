import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Sanitize — only allow alphanumeric, spaces, and basic punctuation
  const sanitized = q.replace(/[^\w\s\-&']/gi, "").substring(0, 50);

  const products = await db.product.findMany({
    where: {
      isAvailable: true,
      OR: [
        { name: { contains: sanitized } },
        { shortDesc: { contains: sanitized } },
        { description: { contains: sanitized } },
        { category: { name: { contains: sanitized } } },
      ],
    },
    include: { category: true },
    take: 12,
    orderBy: [{ isBestseller: "desc" }, { name: "asc" }],
  });

  const results = products.map((p) => {
    let image: string | null = null;
    try {
      const imgs = JSON.parse(p.images || "[]");
      image = Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : null;
    } catch {}
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      basePrice: p.basePrice,
      image,
      categoryName: p.category.name,
    };
  });

  return NextResponse.json({ results });
}
