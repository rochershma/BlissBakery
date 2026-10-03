import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AppHeader, AppFooter } from "@/components/v5/app-header";
import { parseJsonSafe } from "@/lib/utils";
import { CustomCakeForm, type CustomCakeConfig } from "./custom-cake-form";

export const metadata = {
  title: "Custom Cakes",
  description: "Design your own eggless cake — any theme, any flavour, 500 g to 6 kg. Share a photo and get a quote on WhatsApp.",
};

const FALLBACK_SIZES = ["0.5 Kg", "1 Kg", "1.5 Kg", "2 Kg", "3 Kg", "4 Kg", "5 Kg"];
const FALLBACK_FLAVOURS = ["Vanilla", "Chocolate", "Butterscotch", "Pineapple", "Red Velvet", "Black Forest", "Strawberry"];

export default async function CustomCakesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await db.store.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, name: true, phone: true, staffWhatsApp: true,
      defaultFlavours: true, defaultCustomSizes: true, customCakeImage: true,
    },
  });
  if (!store) notFound();

  // Inspiration comes from the outlet's own artwork, not stock tiles.
  const tags = await db.themeTag.findMany({
    where: { isActive: true, image: { not: null }, theme: { storeId: store.id, isActive: true } },
    select: { name: true, image: true },
    orderBy: { sortOrder: "asc" },
    take: 10,
  });
  const fallback = tags.length
    ? []
    : [
        ...(await db.theme.findMany({ where: { storeId: store.id, isActive: true, image: { not: null } }, select: { name: true, image: true }, orderBy: { sortOrder: "asc" } })),
        ...(await db.occasion.findMany({ where: { storeId: store.id, isActive: true, image: { not: null } }, select: { name: true, image: true }, orderBy: { sortOrder: "asc" } })),
      ].slice(0, 10);
  const inspiration = [...tags, ...fallback].filter((t) => t.image);

  const sizes = parseJsonSafe<{ kg?: number; name?: string; serves?: string; enabled?: boolean }[]>(store.defaultCustomSizes, [])
    .filter((s) => s.name && s.enabled !== false)
    .sort((a, b) => (a.kg ?? 0) - (b.kg ?? 0))
    .map((s) => ({ name: s.name!, serves: s.serves ?? null }));
  const flavours = parseJsonSafe<string[]>(store.defaultFlavours, []).filter(Boolean);

  const config: CustomCakeConfig = {
    storeSlug: store.slug,
    storeName: store.name,
    whatsapp: (store.staffWhatsApp || store.phone || "").replace(/\D/g, "").slice(-10),
    sizes: sizes.length ? sizes : FALLBACK_SIZES.map((name) => ({ name, serves: null })),
    flavours: flavours.length ? flavours : FALLBACK_FLAVOURS,
    inspiration: inspiration.map((t) => ({ name: t.name, image: t.image! })),
  };

  return (
    <>
      <AppHeader />
      <CustomCakeForm config={config} />
      <AppFooter />
    </>
  );
}
