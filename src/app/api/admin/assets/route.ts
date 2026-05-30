import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const folder = req.nextUrl.searchParams.get("folder") || undefined;

  const assets = await db.asset.findMany({
    where: folder ? { folder } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    assets: assets.map((a) => ({ url: a.url, filename: a.filename, folder: a.folder })),
  });
}
