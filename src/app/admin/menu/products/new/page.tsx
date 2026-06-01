import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { ProductFormFields } from "@/components/admin/product-form-fields";
import { VariantEditor } from "@/components/admin/variant-editor";
import { FlavourEditor } from "@/components/admin/flavour-editor";

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  const occasions = await db.occasion.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const allRecipients = await db.recipient.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const recipientMap = new Map<string, { slug: string; name: string; image: string | null }>();
  allRecipients.forEach(r => { if (!recipientMap.has(r.slug)) recipientMap.set(r.slug, { slug: r.slug, name: r.name, image: r.image }); });
  const uniqueRecipients = Array.from(recipientMap.values());

  async function createProduct(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const shortDesc = formData.get("shortDesc") as string;
    const description = formData.get("description") as string;
    const basePrice = parseFloat(formData.get("basePrice") as string);
    const mrpPrice = parseFloat(formData.get("mrpPrice") as string) || null;
    const categoryId = formData.get("categoryId") as string;
    const isBestseller = formData.get("isBestseller") === "on";
    const isNew = formData.get("isNew") === "on";
    const isFeatured = formData.get("isFeatured") === "on";
    const isAvailable = formData.get("isAvailable") !== "off";
    const ingredients = formData.get("ingredients") as string;
    const servingInfo = formData.get("servingInfo") as string;
    const images = formData.get("images") as string;
    const occasionsJson = formData.get("occasions") as string;
    const forWhomJson = formData.get("forWhom") as string;
    const flavoursJson = formData.get("flavours") as string;
    const variantsJson = formData.get("variants") as string;
    const variants: { name: string; price: number }[] = (() => {
      try { const v = JSON.parse(variantsJson); return Array.isArray(v) ? v : []; } catch { return []; }
    })();

    // Auto-sync basePrice to cheapest variant if variants exist
    const finalBasePrice = variants.length > 0
      ? Math.min(basePrice, ...variants.map(v => v.price))
      : basePrice;

    const newProduct = await db.product.create({
      data: {
        name,
        slug: slug + "-" + Date.now().toString(36),
        shortDesc: shortDesc || null,
        description: description || null,
        basePrice: finalBasePrice, mrpPrice,
        categoryId,
        isBestseller, isNew, isFeatured, isAvailable,
        ingredients: ingredients || null,
        servingInfo: servingInfo || null,
        images: images || null,
        occasions: occasionsJson || null,
        forWhom: forWhomJson || null,
        flavours: flavoursJson || null,
      },
    });

    // Create variants
    if (variants.length > 0) {
      await db.productVariant.createMany({
        data: variants.map((v, i) => ({
          productId: newProduct.id,
          name: v.name,
          price: v.price,
          sortOrder: i,
        })),
      });
    }

    revalidatePath("/admin/menu");
    redirect("/admin/menu");
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/menu" className="p-1 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground font-serif">Add New Product</h1>
      </div>

      <form action={createProduct} className="max-w-2xl space-y-5">
        {/* Images + Tags */}
        <ProductFormFields
          defaultImages={[]}
          defaultOccasions={[]}
          defaultForWhom={[]}
          occasions={occasions.map(o => ({ slug: o.slug, name: o.name, image: o.image }))}
          recipients={uniqueRecipients}
        />

        {/* Size / Weight Variants */}
        <VariantEditor />

        {/* Flavours */}
        <FlavourEditor />

        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-foreground font-serif">Basic Info</h2>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Product Name *</label>
            <input name="name" required placeholder="e.g., Chocolate Truffle Cake" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Short Description</label>
            <input name="shortDesc" placeholder="One-line description" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Full Description</label>
            <textarea name="description" rows={3} placeholder="Detailed description" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Starting Price (₹) *</label>
              <input name="basePrice" type="number" step="0.01" required placeholder="450" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <p className="text-[10px] text-muted-foreground mt-1">Shown on product cards. Auto-set to cheapest variant if sizes added.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">MRP Price (₹)</label>
              <input name="mrpPrice" type="number" step="0.01" placeholder="For strikethrough" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Category *</label>
              <select name="categoryId" required className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Serving Info</label>
              <input name="servingInfo" placeholder="e.g., Serves 4-6 people" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Ingredients</label>
            <input name="ingredients" placeholder="Flour, sugar, butter, cocoa..." className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
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
