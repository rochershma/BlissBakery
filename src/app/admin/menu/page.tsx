import { db } from "@/lib/db";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import Link from "next/link";
import { Plus, Edit, Eye, EyeOff } from "lucide-react";

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Menu Management</h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} categories · {totalProducts} products
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

      {categories.map((category) => (
        <div key={category.id} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{category.name}</h2>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {category.products.length} items
              </span>
              {!category.isVisible && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <EyeOff className="w-3 h-3" /> Hidden
                </span>
              )}
            </div>
            <Link
              href={`/admin/menu/categories/${category.id}`}
              className="text-xs text-primary hover:underline"
            >
              Edit Category
            </Link>
          </div>

          {category.products.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-6 text-center text-muted-foreground text-sm">
              No products in this category yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {category.products.map((product) => (
                  <div key={product.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-lg flex-shrink-0">
                      🎂
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground truncate">{product.name}</h3>
                        {product.isBestseller && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                            ⭐ Best
                          </span>
                        )}
                        {!product.isAvailable && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{product.shortDesc || "No description"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-foreground">{formatPrice(product.basePrice)}</span>
                        {product.variants.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{product.variants.length} variants
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/admin/menu/products/${product.id}`}
                      className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                    >
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
