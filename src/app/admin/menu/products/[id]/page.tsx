import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { ProductFormFields } from "@/components/admin/product-form-fields";
import { VariantEditor } from "@/components/admin/variant-editor";
import { FlavourEditor } from "@/components/admin/flavour-editor";
import { parseJsonSafe } from "@/lib/utils";
import { requireAdmin, sanitizeMax } from "@/lib/server-utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id }, include: { variants: true, addOns: true } });
  if (!product) return notFound();

  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  const occasions = await db.occasion.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const allRecipients = await db.recipient.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const recipientGroups = occasions.map((occasion) => {
    const recipientMap = new Map<string, { slug: string; name: string; image: string | null }>();
    allRecipients
      .filter((recipient) => recipient.occasionId === occasion.id)
      .forEach((recipient) => {
        if (!recipientMap.has(recipient.slug)) {
          recipientMap.set(recipient.slug, { slug: recipient.slug, name: recipient.name, image: recipient.image });
        }
      });
    return { occasionSlug: occasion.slug, recipients: Array.from(recipientMap.values()) };
  });

  async function updateProduct(formData: FormData) {
    "use server";
    await requireAdmin();
    const name = sanitizeMax(formData.get("name") as string, 200) || "";
    const shortDesc = sanitizeMax(formData.get("shortDesc") as string, 300);
    const description = sanitizeMax(formData.get("description") as string, 2000);
    const basePrice = Math.max(0, parseFloat(formData.get("basePrice") as string) || 0);
    const mrpPrice = Math.max(0, parseFloat(formData.get("mrpPrice") as string) || 0) || null;
    const categoryId = formData.get("categoryId") as string;
    const isBestseller = formData.get("isBestseller") === "on";
    const isNew = formData.get("isNew") === "on";
    const isFeatured = formData.get("isFeatured") === "on";
    const isAvailable = formData.get("isAvailable") === "on";
    const ingredients = formData.get("ingredients") as string;
    const servingInfo = formData.get("servingInfo") as string;
    const images = formData.get("images") as string;
    const occasionsJson = formData.get("occasions") as string;
    const forWhomJson = formData.get("forWhom") as string;
    const flavoursJson = formData.get("flavours") as string;
    const variantsJson = formData.get("variants") as string;
    const variants: { name: string; price: number; serves?: string }[] = (() => {
      try { const v = JSON.parse(variantsJson); return Array.isArray(v) ? v : []; } catch { return []; }
    })();

    // Auto-sync basePrice to cheapest variant if variants exist
    const finalBasePrice = variants.length > 0
      ? Math.min(basePrice, ...variants.map(v => v.price))
      : basePrice;

    await db.product.update({
      where: { id },
      data: {
        name, shortDesc: shortDesc || null, description: description || null,
        basePrice: finalBasePrice, mrpPrice, categoryId,
        isBestseller, isNew, isFeatured, isAvailable,
        ingredients: ingredients || null,
        servingInfo: servingInfo || null,
        images: images || product!.images,
        occasions: occasionsJson || null,
        forWhom: forWhomJson || null,
        flavours: flavoursJson || null,
      },
    });

    // Replace all variants
    await db.productVariant.deleteMany({ where: { productId: id } });
    if (variants.length > 0) {
      await db.productVariant.createMany({
        data: variants.map((v, i) => ({
          productId: id,
          name: v.name,
          price: v.price,
          serves: v.serves || null,
          sortOrder: i,
        })),
      });
    }
    revalidatePath("/admin/menu");
    redirect("/admin/menu");
  }

  async function deleteProduct() {
    "use server";
    await requireAdmin();
    await db.product.delete({ where: { id } });
    revalidatePath("/admin/menu");
    redirect("/admin/menu");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/menu" className="p-1 rounded-full hover:bg-muted transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold text-foreground font-serif">Edit: {product.name}</h1>
        </div>
        <form action={deleteProduct}>
          <button type="submit" className="flex items-center gap-1 text-sm text-destructive hover:bg-red-50 px-3 py-2 rounded-xl transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </form>
      </div>

      <form action={updateProduct} className="max-w-2xl space-y-5">
        {/* Category Selection - FIRST */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-foreground font-serif">Category</h2>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Select Category *</label>
            <select name="categoryId" required defaultValue={product.categoryId} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
              <option value="">Choose a category...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Images + Tags (client components) */}
        <ProductFormFields
          defaultImages={parseJsonSafe<string[]>(product.images, [])}
          defaultOccasions={parseJsonSafe<string[]>((product as any).occasions, [])}
          defaultForWhom={parseJsonSafe<string[]>((product as any).forWhom, [])}
          occasions={occasions.map(o => ({ slug: o.slug, name: o.name, image: o.image }))}
          recipientGroups={recipientGroups}
        />

        {/* Size / Weight Variants */}
        <VariantEditor
          defaultVariants={product.variants.map(v => ({ id: v.id, name: v.name, price: v.price, serves: v.serves || "" }))}
        />

        {/* Flavours */}
        <FlavourEditor defaultFlavours={parseJsonSafe<string[]>((product as any).flavours, [])} />

        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-foreground font-serif">Basic Info</h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Starting Price (₹) *</label>
              <input name="basePrice" inputMode="decimal" required defaultValue={product.basePrice} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <p className="text-[10px] text-muted-foreground mt-1">Auto-set to cheapest variant if sizes added.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">MRP Price (₹)</label>
              <input name="mrpPrice" inputMode="decimal" defaultValue={(product as any).mrpPrice || ""} placeholder="For strikethrough display" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Serving Info</label>
            <input name="servingInfo" defaultValue={(product as any).servingInfo || ""} placeholder="e.g., Serves 4-6 people" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
