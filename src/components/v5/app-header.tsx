import { db } from "@/lib/db";
import { navLinks } from "@/lib/nav";
import { getCustomerStoreId } from "@/lib/customer-store";
import { SiteHeaderV5 } from "./site-header";
import { SiteFooter } from "./site-footer";

/** Self-fetching header so any page can drop it in without wiring props. */
export async function AppHeader() {
  const store = await db.store.findFirst({
    where: { id: await getCustomerStoreId() },
    select: { slug: true, name: true, city: true, logo: true, pincode: true },
  });
  if (!store) return <SiteHeaderV5 />;
  const nav = await navLinks(store.slug);
  return <SiteHeaderV5 storeSlug={store.slug} storeName={store.name} storeCity={store.city} logo={store.logo} nav={nav} pincode={store.pincode} />;
}

export async function AppFooter() {
  const store = await db.store.findFirst({
    where: { id: await getCustomerStoreId() },
    select: { slug: true, phone: true, logo: true },
  });
  return <SiteFooter storeSlug={store?.slug} phone={store?.phone} logo={store?.logo} />;
}
