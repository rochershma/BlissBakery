import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-do-not-use-in-prod"
);

const COOKIE_NAME = "bb-session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin/* routes
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/?unauthorized=1", req.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = payload.role as string;

      if (role !== "ADMIN" && role !== "STAFF") {
        return NextResponse.redirect(new URL("/?unauthorized=1", req.url));
      }
    } catch {
      // Invalid/expired token
      return NextResponse.redirect(new URL("/?unauthorized=1", req.url));
    }
  }

  // Protect /api/admin/* API routes
  if (pathname.startsWith("/api/admin")) {
    const token = req.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = payload.role as string;

      if (role !== "ADMIN" && role !== "STAFF") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Redirect old occasion slug patterns (e.g. /cakes/birthday-cakes → /cakes/birthday)
  if (pathname.startsWith("/cakes/")) {
    const OCCASION_REDIRECTS: Record<string, string> = {
      "/cakes/birthday-cakes": "/cakes/birthday",
      "/cakes/anniversary-cakes": "/cakes/anniversary",
      "/cakes/wedding-cakes": "/cakes/wedding",
      "/cakes/designer-cakes": "/cakes/designer",
      "/cakes/festival-cakes": "/cakes/festival",
      "/cakes/kids-cakes": "/cakes/kids",
      "/cakes/retirement-cakes": "/cakes/retirement",
      "/cakes/special-milestones-cakes": "/cakes/special-milestones",
    };
    const target = OCCASION_REDIRECTS[pathname];
    if (target) {
      return NextResponse.redirect(new URL(target, req.url), 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/cakes/:path*"],
};
