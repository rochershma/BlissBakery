import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { ProductImageField } from "@/components/admin/product-image-field";

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  const stores = await db.store.findMany();

  async function createProduct(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const shortDesc = formData.get("shortDesc") as string;
    const description = formData.get("description") as string;
    const basePrice = parseFloat(formData.get("basePrice") as string);
    const categoryId = formData.get("categoryId") as string;
    const isBestseller = formData.get("isBestseller") === "on";
    const isNew = formData.get("isNew") === "on";
    const isFeatured = formData.get("isFeatured") === "on";
    const isAvailable = formData.get("isAvailable") !== "off";
    const ingredients = formData.get("ingredients") as string;
    const imageUrl = formData.get("imageUrl") as string;

    await db.product.create({
      data: {
        name,
        slug: slug + "-" + Date.now().toString(36),
        shortDesc: shortDesc || null,
        description: description || null,
        basePrice,
        categoryId,
        isBestseller,
        isNew,
        isFeatured,
        isAvailable,
        ingredients: ingredients || null,
        images: imageUrl ? JSON.stringify([imageUrl]) : null,
      },
    });

    revalidatePath("/admin/menu");
    redirect("/admin/menu");
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/menu" className="p-1 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Add New Product</h1>
      </div>

      <form action={createProduct} className="max-w-2xl space-y-5">
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Basic Info</h2>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Product Name *</label>
            <input name="name" required placeholder="e.g., Chocolate Truffle Cake" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Short Description</label>
            <input name="shortDesc" placeholder="One-line description for menu listing" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Full Description</label>
            <textarea name="description" rows={4} placeholder="Detailed description for product page" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Base Price (₹) *</label>
              <input name="basePrice" type="number" step="0.01" required placeholder="450" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Category *</label>
              <select name="categoryId" required className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Ingredients</label>
            <input name="ingredients" placeholder="Flour, sugar, butter, cocoa..." className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <ProductImageField defaultValue="" />
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <h2 className="font-semibold text-foreground">Flags</h2>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="isBestseller" className="w-4 h-4 accent-primary" />
              ⭐ Bestseller
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="isNew" className="w-4 h-4 accent-primary" />
              ✨ New
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="isFeatured" className="w-4 h-4 accent-primary" />
              🌟 Featured
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" name="isAvailable" defaultChecked className="w-4 h-4 accent-primary" />
              ✅ Available
            </label>
          </div>
        </div>

        <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors btn-press flex items-center justify-center gap-2">
          <Save className="w-5 h-5" />
          Add Product
        </button>
      </form>
    </div>
  );
}
