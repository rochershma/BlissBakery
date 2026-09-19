import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  subtitle: z.string().max(1000).nullable().optional(),
  ctaText: z.string().max(100).nullable().optional(),
  ctaLink: z.string().max(500).nullable().optional(),
  mediaUrl: z.string().min(1).max(500).optional(),
  mobileMediaUrl: z.string().max(500).nullable().optional(),
  linkUrl: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

interface Ctx { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { title, subtitle, ctaText, ctaLink, mediaUrl, mobileMediaUrl, linkUrl, sortOrder, isActive } = parsed.data;

  const sanitize = (s: string | null | undefined) => s != null ? s.replace(/<[^>]*>/g, "").trim() || null : s;

  const banner = await db.banner.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: sanitize(title) }),
      ...(subtitle !== undefined && { subtitle: sanitize(subtitle) }),
      ...(ctaText !== undefined && { ctaText: sanitize(ctaText) }),
      ...(ctaLink !== undefined && { ctaLink }),
      ...(mediaUrl !== undefined && { mediaUrl }),
      ...(mobileMediaUrl !== undefined && { mobileMediaUrl }),
      ...(linkUrl !== undefined && { linkUrl }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json({ banner });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  await db.banner.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
