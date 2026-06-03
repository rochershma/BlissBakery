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

export default async function MenuPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { category: activeCategory, q: searchQuery } = await searchParams;

  const store = await db.store.findUnique({
    where: { slug },
    include: {
      categories: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            where: { isAvailable: true },
            orderBy: [{ isBestseller: "desc" }, { name: "asc" }],
            include: { variants: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });

  if (!store) return notFound();

  const hours = parseJsonSafe<Record<string, { open: string; close: string }>>(
    store.operatingHours, {}
  );
  const today = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
  const todayHours = hours[today];

  // Flatten all products for search
  const allProducts = store.categories.flatMap((c) =>
    c.products.map((p) => ({ ...p, categorySlug: c.slug, categoryName: c.name }))
  );

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
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      {/* Slim store info bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-border px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" />{store.city}</span>
            {todayHours && <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary" />{todayHours.open} – {todayHours.close}</span>}
            <span className={`font-medium ${store.isOpen ? "text-success" : "text-destructive"}`}>{store.isOpen ? "● Open" : "● Closed"}</span>
          </div>
          <span className="label-premium text-primary">Pick Up</span>
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
