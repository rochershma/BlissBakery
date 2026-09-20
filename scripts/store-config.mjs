// Prints each outlet's configuration side by side, so a new outlet can be
// checked against an established one before it takes orders.
//   node --env-file=.env scripts/store-config.mjs
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const stores = await db.store.findMany({
  select: {
    slug: true, name: true, city: true, pincode: true, phone: true, logo: true,
    isOpen: true, servicePincodes: true, deliveryRadius: true, minDeliveryOrder: true,
    deliveryCharge: true, packagingCharge: true, gstRate: true,
    orderLeadHours: true, addOnMaxQty: true, staffWhatsApp: true,
    deliveryTiers: true, deliverySlots: true, defaultFlavours: true,
    _count: { select: { categories: true, storeAddOns: true, banners: true, occasions: true, themes: true, orders: true } },
  },
});

const short = (v) => (v == null ? "—" : String(v).length > 60 ? String(v).slice(0, 60) + "…" : String(v));
for (const s of stores) {
  console.log(`\n== ${s.name} (${s.slug})`);
  for (const [k, v] of Object.entries(s)) {
    if (k === "_count") continue;
    console.log(`   ${k.padEnd(18)} ${short(v)}`);
  }
  console.log(`   ${"counts".padEnd(18)} ${JSON.stringify(s._count)}`);
}
await db.$disconnect();
