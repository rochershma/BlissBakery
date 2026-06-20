import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import { MenuClient } from "./menu-client";
import { SiteHeader } from "@/components/shared/site-header";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}

export const revalidate = 120;

export default async function MenuPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { category: activeCategory, q: searchQuery } = await searchParams;

  const store = await db.store.findUnique({
    where: { slug },
    include: {
      categories: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!store) return notFound();

  // Fetch ALL available products for this store's categories directly
  const products = await db.product.findMany({
    where: {
      isAvailable: true,
      category: { storeId: store.id, isVisible: true },
    },
    orderBy: [{ isBestseller: "desc" }, { name: "asc" }],
    include: {
      category: true,
      variants: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  const hours = parseJsonSafe<Record<string, { open: string; close: string }>>(
    store.operatingHours, {}
  );
  const today = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
  const todayHours = hours[today];

  // Map products with category info
  const allProducts = products.map((p) => ({
    ...p,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
  }));

  // Filter
  const filtered = activeCategory
    ? allProducts.filter((p) => p.categorySlug === activeCategory)
    : allProducts;

  const searched = searchQuery
    ? filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.shortDesc || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filtered;

  const storeAddOns = store ? await db.storeAddOn.findMany({
    where: { storeId: store.id, isActive: true },
    orderBy: { sortOrder: "asc" },
  }) : [];

  return (
    <div className="flex flex-col min-h-screen bg-white md:bg-background">
      <SiteHeader />

      {/* Store info — desktop only */}
      <div className="hidden md:block border-b border-border/50 px-4 py-1.5">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" />{store.city}</span>
            {todayHours && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary" />{todayHours.open} – {todayHours.close}</span>}
            <span className={`font-medium ${store.isOpen ? "text-success" : "text-destructive"}`}>{store.isOpen ? "Open" : "Closed"}</span>
          </div>
        </div>
      </div>

      <MenuClient
        storeSlug={slug}
        categories={store.categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
        storeAddOns={storeAddOns.map(a => ({ id: a.id, name: a.name, price: a.price, image: a.image, category: a.category }))}
        products={searched.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          shortDesc: p.shortDesc,
          basePrice: p.basePrice,
          mrpPrice: p.mrpPrice || null,
          images: parseJsonSafe<string[]>(p.images, []),
          isBestseller: p.isBestseller,
          isNew: p.isNew,
          categorySlug: p.categorySlug,
          categoryName: p.categoryName,
          flavours: parseJsonSafe<string[]>((p as any).flavours, []),
          variants: p.variants?.map((v) => ({ id: v.id, name: v.name, price: v.price })) || [],
        }))}
        activeCategory={activeCategory || null}
        searchQuery={searchQuery || ""}
      />
    </div>
  );
}
