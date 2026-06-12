import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const sanitized = q.replace(/[^\w\s\-&']/gi, "").substring(0, 50);
  const words = sanitized.toLowerCase().split(/\s+/).filter(w => w.length >= 2);

  // Strategy: score-based relevance ranking
  // 1. Fetch candidates broadly (name, shortDesc, category, occasions, themes, themeTags)
  const orConds: any[] = [];
  for (const word of words) {
    orConds.push(
      { name: { contains: word } },
      { shortDesc: { contains: word } },
      { category: { name: { contains: word } } },
      { occasions: { contains: word } },
      { themes: { contains: word } },
      { themeTags: { contains: word } },
    );
  }
  // Also try full phrase on name
  orConds.push({ name: { contains: sanitized } });

  const candidates = await db.product.findMany({
    where: { isAvailable: true, OR: orConds },
    include: { category: true },
    take: 50,
    orderBy: [{ isBestseller: "desc" }, { name: "asc" }],
  });

  // 2. Score each candidate by relevance
  const scored = candidates.map(p => {
    let score = 0;
    const nameLower = p.name.toLowerCase();
    const descLower = (p.shortDesc || "").toLowerCase();
    const catLower = p.category.name.toLowerCase();

    // Full phrase match in name = highest
    if (nameLower.includes(sanitized.toLowerCase())) score += 100;

    // Each word match in name
    for (const w of words) {
      if (nameLower.includes(w)) score += 30;
      if (catLower.includes(w)) score += 15;
      if (descLower.includes(w)) score += 10;
    }

    // Multi-word: bonus if ALL words match name (not just some)
    if (words.length > 1 && words.every(w => nameLower.includes(w))) score += 50;

    // Bestseller boost
    if (p.isBestseller) score += 5;

    return { product: p, score };
  });

  // 3. Sort by score descending, take top 12
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 12);

  const results = top.map(({ product: p }) => {
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

  return NextResponse.json({ results });
}
