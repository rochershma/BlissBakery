import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { ImageField } from "@/components/admin/image-field";

export default async function NewCategoryPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const stores = await db.store.findMany();
  const defaultStore = stores[0];

  async function createCategory(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string).trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
    const image = (formData.get("image") as string) || null;

    // Check for duplicate name
    const existing = await db.category.findFirst({
      where: { name: { equals: name }, storeId: defaultStore.id },
    });
    if (existing) {
      redirect("/admin/menu/categories/new?error=duplicate");
    }

    await db.category.create({
      data: {
        name,
        slug: slug + "-" + Date.now().toString(36),
        sortOrder,
        image,
        storeId: defaultStore.id,
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
        <h1 className="text-2xl font-bold text-foreground font-serif">Add Category</h1>
      </div>

      <form action={createCategory} className="max-w-lg space-y-5">
        {error === "duplicate" && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            A category with this name already exists. Please choose a different name.
          </div>
        )}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Category Name *</label>
            <input name="name" required placeholder="e.g., Cupcakes" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Category Image</label>
            <p className="text-xs text-muted-foreground mb-2">Shown as circular icon on homepage. Upload a square image.</p>
            <ImageField name="image" defaultValue="" label="Category Image" folder="categories" aspectRatio="square" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Sort Order</label>
            <input name="sortOrder" type="number" defaultValue={10} placeholder="0" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
          </div>
        </div>

        <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors btn-press flex items-center justify-center gap-2">
          <Save className="w-5 h-5" />
          Add Category
        </button>
      </form>
    </div>
  );
}
