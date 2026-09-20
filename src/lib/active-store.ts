import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * Which store the admin is currently working in.
 *
 * Every admin screen is scoped to one store the way merchant dashboards work,
 * so the selection lives in a cookie rather than a query string — that keeps it
 * stable across navigations and readable from any server component.
 */
const COOKIE = "bb-admin-store";

export type AdminStore = {
  id: string;
  name: string;
  slug: string;
  city: string;
  pincode: string;
  isOpen: boolean;
};

const SELECT = {
  id: true,
  name: true,
  slug: true,
  city: true,
  pincode: true,
  isOpen: true,
} as const;

/** Every store an admin may switch between, oldest first. */
export async function listStores(): Promise<AdminStore[]> {
  return db.store.findMany({ select: SELECT, orderBy: { createdAt: "asc" } });
}

/**
 * The selected store, or the oldest one when nothing is selected yet or the
 * cookie points at a store that has since been deleted.
 */
export async function getActiveStore(): Promise<AdminStore | null> {
  const id = (await cookies()).get(COOKIE)?.value;

  if (id) {
    const picked = await db.store.findUnique({ where: { id }, select: SELECT });
    if (picked) return picked;
  }

  return db.store.findFirst({ select: SELECT, orderBy: { createdAt: "asc" } });
}

/** Same as getActiveStore, but for callers that cannot render an empty state. */
export async function requireActiveStore(): Promise<AdminStore> {
  const store = await getActiveStore();
  if (!store) throw new Error("No store configured");
  return store;
}

/** For callers that need the whole store row, not just the switcher fields. */
export async function getActiveStoreId(): Promise<string | null> {
  return (await getActiveStore())?.id ?? null;
}

export async function setActiveStore(id: string) {
  // Never trust the posted id — an unknown one would silently scope queries to nothing.
  const exists = await db.store.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return;

  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 180 * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearActiveStore() {
  (await cookies()).delete(COOKIE);
}
