import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * The outlet a customer is shopping at.
 *
 * Pages like the homepage, occasion and theme listings are not under
 * /store/[slug], so the choice lives in a cookie that every server component
 * can read. Falls back to the oldest open store for first-time visitors and
 * crawlers.
 */
const COOKIE = "bb-store";

export const STORE_COOKIE = COOKIE;

export async function getCustomerStoreSlug(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

/** Resolves the chosen store, or the default one when nothing is chosen yet. */
export async function getCustomerStoreId(): Promise<string | undefined> {
  const slug = await getCustomerStoreSlug();

  if (slug) {
    const picked = await db.store.findFirst({
      where: { slug, isOpen: true },
      select: { id: true },
    });
    if (picked) return picked.id;
  }

  // Cookie missing, or pointing at a store that has since closed.
  const fallback = await db.store.findFirst({
    where: { isOpen: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return fallback?.id;
}
