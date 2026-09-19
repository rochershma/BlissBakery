import { db } from "@/lib/db";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import Link from "next/link";
import { Plus, Edit, Eye, EyeOff } from "lucide-react";
import { AdminMenuClient } from "./admin-menu-client";

export default async function AdminMenuPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        orderBy: { name: "asc" },
        include: { variants: true },
      },
    },
  });

  const totalProducts = categories.reduce((sum, c) => sum + c.products.length, 0);

  const data = categories.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    isVisible: c.isVisible,
    products: c.products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDesc: p.shortDesc,
      basePrice: p.basePrice,
      isBestseller: p.isBestseller,
      isNew: p.isNew,
      isAvailable: p.isAvailable,
      variantCount: p.variants.length,
      image: (() => { try { const imgs = JSON.parse(p.images as string); return Array.isArray(imgs) ? imgs[0] : null; } catch { return null; } })(),
    })),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Menu Management</h1>
          <p className="text-sm text-muted-foreground">
            {categories.filter(c => c.products.length > 0).length} categories · {totalProducts} products
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/menu/categories/new"
            className="flex items-center gap-1 bg-white border border-border px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" /> Category
          </Link>
          <Link
            href="/admin/menu/products/new"
            className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" /> Product
          </Link>
        </div>
      </div>

      <AdminMenuClient categories={data} />
    </div>
  );
}
