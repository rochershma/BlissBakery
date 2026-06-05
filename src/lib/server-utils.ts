import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Server-side admin check for server actions.
 * Throws if user is not ADMIN or STAFF.
 */
export async function requireAdmin(): Promise<{ userId: string; role: string }> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) throw new Error("Forbidden");
  return session;
}

/**
 * Strip HTML tags to prevent XSS. Returns trimmed string or null.
 */
export function sanitize(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.replace(/<[^>]*>/g, "").trim() || null;
}

/**
 * Sanitize and enforce max length.
 */
export function sanitizeMax(value: string | null | undefined, maxLen: number): string | null {
  const clean = sanitize(value);
  return clean ? clean.slice(0, maxLen) : null;
}
