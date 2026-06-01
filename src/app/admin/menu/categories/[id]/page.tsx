import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Eye, EyeOff } from "lucide-react";
import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import { ImageField } from "@/components/admin/image-field";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const category = await db.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!category) return notFound();

  async function updateCategory(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
    const isVisible = formData.get("isVisible") === "on";
    const image = (formData.get("image") as string) || null;

    await db.category.update({ where: { id }, data: { name, sortOrder, isVisible, image } });
    revalidatePath("/admin/menu");
    redirect("/admin/menu");
  }

  async function deleteCategory() {
    "use server";
    await db.category.delete({ where: { id } });
    revalidatePath("/admin/menu");
    redirect("/admin/menu");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/menu" className="p-1 rounded-full hover:bg-muted transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold text-foreground font-serif">Edit: {category.name}</h1>
        </div>
        <ConfirmDeleteForm action={deleteCategory} confirmMessage={category._count.products > 0 ? `Delete category "${category.name}" and its ${category._count.products} products? This cannot be undone.` : `Delete category "${category.name}"?`}>
          <button type="submit" className="flex items-center gap-1 text-sm text-destructive hover:bg-red-50 px-3 py-2 rounded-xl transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </ConfirmDeleteForm>
      </div>

      <form action={updateCategory} className="max-w-lg space-y-5">
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Category Name *</label>
            <input name="name" required defaultValue={category.name} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Category Image</label>
            <p className="text-xs text-muted-foreground mb-2">Shown as circular icon on homepage. Upload a square image for best results.</p>
            <ImageField name="image" defaultValue={category.image || ""} label="Category Image" folder="categories" aspectRatio="square" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Sort Order</label>
            <input name="sortOrder" type="number" defaultValue={category.sortOrder} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="isVisible" defaultChecked={category.isVisible} className="w-4 h-4 accent-primary" />
            {category.isVisible ? <><Eye className="w-4 h-4 text-green-600" /> Visible on menu</> : <><EyeOff className="w-4 h-4 text-muted-foreground" /> Hidden from menu</>}
          </label>
          <p className="text-xs text-muted-foreground">{category._count.products} products in this category</p>
        </div>
        <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors btn-press flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> Save Changes
        </button>
      </form>
    </div>
  );
}
