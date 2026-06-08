import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Sanitize — only allow alphanumeric, spaces, and basic punctuation
  const sanitized = q.replace(/[^\w\s\-&']/gi, "").substring(0, 50);

  // Search with priority: name matches first, then description
  // First: exact name/shortDesc matches (high relevance)
  const nameMatches = await db.product.findMany({
    where: {
      isAvailable: true,
      OR: [
        { name: { contains: sanitized } },
        { shortDesc: { contains: sanitized } },
        { category: { name: { contains: sanitized } } },
      ],
    },
    include: { category: true },
    take: 12,
    orderBy: [{ isBestseller: "desc" }, { name: "asc" }],
  });

  // If not enough name matches, fill with description matches
  let products = nameMatches;
  if (nameMatches.length < 12) {
    const nameIds = nameMatches.map(p => p.id);
    const descMatches = await db.product.findMany({
      where: {
        isAvailable: true,
        id: { notIn: nameIds },
        description: { contains: sanitized },
      },
      include: { category: true },
      take: 12 - nameMatches.length,
      orderBy: [{ isBestseller: "desc" }, { name: "asc" }],
    });
    products = [...nameMatches, ...descMatches];
  }

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
