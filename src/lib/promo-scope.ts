import { db } from "@/lib/db";

/**
 * A promo belongs either to one store or to the whole chain (storeId null).
 * Returns the `where` fragment that lets a customer of `storeSlug` see both,
 * and — when the slug is unknown — chain-wide codes only.
 */
export async function promoScope(storeSlug?: string | null) {
  const store = storeSlug
    ? await db.store.findUnique({ where: { slug: storeSlug }, select: { id: true } })
    : null;

  return store
    ? { OR: [{ storeId: null }, { storeId: store.id }] }
    : { storeId: null };
}
