import { db } from "@/lib/db";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomInt } from "crypto";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "dev-secret-do-not-use-in-prod") {
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    throw new Error("FATAL: JWT_SECRET must be set in production. Generate one with: openssl rand -base64 32");
  }
  if (process.env.NODE_ENV !== "development") {
    console.warn("⚠️  Using insecure default JWT_SECRET. Set JWT_SECRET env var before deploying.");
  }
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-do-not-use-in-prod"
);

const COOKIE_NAME = "bb-session";

export function generateOTP(): string {
  return randomInt(100000, 999999).toString();
}

export async function createOtpSession(phone: string): Promise<string> {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Delete old OTPs for this phone (keep permanent test OTPs expiring after 2098)
  await db.otpSession.deleteMany({
    where: { phone, expiresAt: { lt: new Date("2098-01-01") } },
  });

  await db.otpSession.create({
    data: { phone, otp, expiresAt },
  });

  return otp;
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const session = await db.otpSession.findFirst({
    where: {
      phone,
      otp,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!session) return false;

  // Don't mark permanent test OTPs as verified (expiry > 2098)
  const isPermanent = session.expiresAt > new Date("2098-01-01");
  if (!isPermanent) {
    await db.otpSession.update({
      where: { id: session.id },
      data: { verified: true },
    });
  }

  return true;
}

export async function createSession(userId: string, role: string): Promise<string> {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  return token;
}

export async function getSession(): Promise<{ userId: string; role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as string, role: payload.role as string };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
  });

  return user;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") || false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME };
