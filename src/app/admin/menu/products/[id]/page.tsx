import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { ProductImageField } from "@/components/admin/product-image-field";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id }, include: { variants: true, addOns: true } });
  if (!product) return notFound();

  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });

  async function updateProduct(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const shortDesc = formData.get("shortDesc") as string;
    const description = formData.get("description") as string;
    const basePrice = parseFloat(formData.get("basePrice") as string);
    const categoryId = formData.get("categoryId") as string;
    const isBestseller = formData.get("isBestseller") === "on";
    const isNew = formData.get("isNew") === "on";
    const isFeatured = formData.get("isFeatured") === "on";
    const isAvailable = formData.get("isAvailable") === "on";
    const ingredients = formData.get("ingredients") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const images = imageUrl ? JSON.stringify([imageUrl]) : product!.images;

    await db.product.update({
      where: { id },
      data: { name, shortDesc: shortDesc || null, description: description || null, basePrice, categoryId, isBestseller, isNew, isFeatured, isAvailable, ingredients: ingredients || null, images },
    });
    revalidatePath("/admin/menu");
    redirect("/admin/menu");
  }

  async function deleteProduct() {
    "use server";
    await db.product.delete({ where: { id } });
    revalidatePath("/admin/menu");
    redirect("/admin/menu");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/menu" className="p-1 rounded-full hover:bg-muted transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold text-foreground">Edit: {product.name}</h1>
        </div>
        <form action={deleteProduct}>
          <button type="submit" className="flex items-center gap-1 text-sm text-destructive hover:bg-red-50 px-3 py-2 rounded-xl transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </form>
      </div>

      <form action={updateProduct} className="max-w-2xl space-y-5">
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Basic Info</h2>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Product Name *</label>
            <input name="name" required defaultValue={product.name} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Short Description</label>
            <input name="shortDesc" defaultValue={product.shortDesc || ""} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Full Description</label>
            <textarea name="description" rows={3} defaultValue={product.description || ""} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          <ProductImageField defaultValue={product.images ? (JSON.parse(product.images as string || "[]")[0] || "") : ""} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Base Price (₹) *</label>
              <input name="basePrice" type="number" step="0.01" required defaultValue={product.basePrice} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Category *</label>
              <select name="categoryId" required defaultValue={product.categoryId} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Ingredients</label>
            <input name="ingredients" defaultValue={product.ingredients || ""} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <h2 className="font-semibold text-foreground">Flags</h2>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" name="isBestseller" defaultChecked={product.isBestseller} className="w-4 h-4 accent-primary" /> ⭐ Bestseller</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" name="isNew" defaultChecked={product.isNew} className="w-4 h-4 accent-primary" /> ✨ New</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} className="w-4 h-4 accent-primary" /> 🌟 Featured</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" name="isAvailable" defaultChecked={product.isAvailable} className="w-4 h-4 accent-primary" /> ✅ Available</label>
          </div>
        </div>
        <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors btn-press flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> Save Changes
        </button>
      </form>
    </div>
  );
}
