import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const bannerSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  subtitle: z.string().max(1000).nullable().optional(),
  ctaText: z.string().max(100).nullable().optional(),
  ctaLink: z.string().max(500).nullable().optional(),
  mediaUrl: z.string().min(1).max(500),
  mobileMediaUrl: z.string().max(500).nullable().optional(),
  linkUrl: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100).optional(),
});

export async function GET() {
  // Public: return active banners for storefront
  const store = await db.store.findFirst();
  if (!store) return NextResponse.json({ banners: [] });

  const banners = await db.banner.findMany({
    where: { storeId: store.id, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const store = await db.store.findFirst();
  if (!store) return NextResponse.json({ error: "No store" }, { status: 400 });

  const body = await req.json();
  const parsed = bannerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { title, subtitle, ctaText, ctaLink, mediaUrl, mobileMediaUrl, linkUrl, sortOrder } = parsed.data;

  const sanitize = (s: string | null | undefined) => s?.replace(/<[^>]*>/g, "").trim() || null;

  const banner = await db.banner.create({
    data: {
      title: sanitize(title),
      subtitle: sanitize(subtitle),
      ctaText: sanitize(ctaText),
      ctaLink: ctaLink || null,
      mediaUrl,
      mobileMediaUrl: mobileMediaUrl || null,
      linkUrl: linkUrl || null,
      sortOrder: sortOrder ?? 0,
      isActive: true,
      storeId: store.id,
    },
  });

  return NextResponse.json({ banner }, { status: 201 });
}
