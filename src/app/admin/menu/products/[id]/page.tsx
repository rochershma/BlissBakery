import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/admin/submit-button";
import { ProductFormFields } from "@/components/admin/product-form-fields";
import { VariantEditor } from "@/components/admin/variant-editor";
import { FlavourEditor } from "@/components/admin/flavour-editor";
import { PricingStrategyEditor } from "@/components/admin/pricing-strategy-editor";
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
  const themes = await db.theme.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
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
    const themesJson = formData.get("themes") as string;
    const flavoursJson = formData.get("flavours") as string;
    const variantsJson = formData.get("variants") as string;
    const pricingStrategy = (formData.get("pricingStrategy") as string) || "FIXED";
    const designCharge = Math.max(0, parseFloat(formData.get("designCharge") as string) || 0);
    const base500gPrice = Math.max(0, parseFloat(formData.get("base500gPrice") as string) || 0) || null;
    const flavourPricesJson = formData.get("flavourPrices") as string;
    const defaultFlavour = (formData.get("defaultFlavour") as string) || null;
    const discountPct = Math.max(0, Math.min(90, parseFloat(formData.get("discountPct") as string) || 0));
    const variants: { name: string; price: number; serves?: string }[] = (() => {
      try { const v = JSON.parse(variantsJson); return Array.isArray(v) ? v : []; } catch { return []; }
    })();

    // Parse flavour prices
    const flavourPricesArr: { name: string; price500g: number }[] = (() => {
      try { return JSON.parse(flavourPricesJson || "[]"); } catch { return []; }
    })();

    // Auto-calculate basePrice
    let finalBasePrice = basePrice;
    if (pricingStrategy === "CUSTOM") {
      const cheapest500g = flavourPricesArr.length > 0 ? Math.min(...flavourPricesArr.map(fp => fp.price500g)) : (base500gPrice || 300);
      finalBasePrice = Math.round(cheapest500g * 0.5 * 2 + designCharge);
    } else if (variants.length > 0) {
      finalBasePrice = Math.min(basePrice || Infinity, ...variants.map(v => v.price));
    }

    const finalMrpPrice = pricingStrategy === "CUSTOM" && discountPct > 0
      ? Math.round(finalBasePrice / (1 - discountPct / 100))
      : mrpPrice;

    await db.product.update({
      where: { id },
      data: {
        name, shortDesc: shortDesc || null, description: description || null,
        basePrice: finalBasePrice, mrpPrice: finalMrpPrice, categoryId,
        isBestseller, isNew, isFeatured, isAvailable,
        ingredients: ingredients || null,
        servingInfo: servingInfo || null,
        images: images || product!.images,
        occasions: occasionsJson || null,
        forWhom: forWhomJson || null,
        themes: themesJson || null,
        flavours: flavoursJson || null,
        pricingStrategy,
        designCharge,
        base500gPrice,
        flavourPrices: pricingStrategy === "CUSTOM" ? (flavourPricesJson || null) : null,
        defaultFlavour,
      },
    });

    // Replace all variants
    await db.productVariant.deleteMany({ where: { productId: id } });
    if (pricingStrategy === "CUSTOM") {
      const store = await db.store.findFirst({ select: { defaultCustomSizes: true } });
      let customSizes = [
        { kg: 0.5, name: "0.5 Kg", serves: "Serves 4-6" },
        { kg: 1, name: "1 Kg", serves: "Serves 8-10" },
        { kg: 1.5, name: "1.5 Kg", serves: "Serves 12-15" },
        { kg: 2, name: "2 Kg", serves: "Serves 18-20" },
        { kg: 2.5, name: "2.5 Kg", serves: "Serves 22-25" },
        { kg: 3, name: "3 Kg", serves: "Serves 28-30" },
        { kg: 4, name: "4 Kg", serves: "Serves 35-40" },
        { kg: 5, name: "5 Kg", serves: "Serves 45-50" },
      ];
      try { if (store?.defaultCustomSizes) customSizes = JSON.parse(store.defaultCustomSizes); } catch {}
      const cheapest500g = flavourPricesArr.length > 0 ? Math.min(...flavourPricesArr.map(fp => fp.price500g)) : (base500gPrice || 300);
      await db.productVariant.createMany({
        data: customSizes.map((s: { kg: number; name: string; serves: string }, i: number) => ({
          productId: id,
          name: s.name,
          price: Math.round(cheapest500g * s.kg * 2 + designCharge),
          serves: s.serves || null,
          sortOrder: i,
        })),
      });
    } else if (variants.length > 0) {
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

  async function cloneProduct() {
    "use server";
    await requireAdmin();
    const src = await db.product.findUnique({ where: { id }, include: { variants: true, addOns: true } });
    if (!src) return;
    const cloned = await db.product.create({
      data: {
        name: src.name + " (Copy)",
        slug: src.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-copy-" + Date.now().toString(36),
        description: src.description, shortDesc: src.shortDesc,
        basePrice: src.basePrice, mrpPrice: src.mrpPrice,
        categoryId: src.categoryId,
        isBestseller: false, isNew: false, isFeatured: false, isAvailable: false,
        ingredients: src.ingredients, servingInfo: src.servingInfo,
        images: src.images, occasions: src.occasions, themes: src.themes,
        forWhom: src.forWhom, flavours: src.flavours,
        pricingStrategy: src.pricingStrategy, designCharge: src.designCharge,
        base500gPrice: src.base500gPrice, flavourPrices: src.flavourPrices,
        defaultFlavour: src.defaultFlavour,
      },
    });
    if (src.variants.length > 0) {
      await db.productVariant.createMany({
        data: src.variants.map((v, i) => ({
          productId: cloned.id, name: v.name, price: v.price, serves: v.serves, sortOrder: i,
        })),
      });
    }
    revalidatePath("/admin/menu");
    redirect(`/admin/menu/products/${cloned.id}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/menu" className="p-1 rounded-full hover:bg-muted transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold text-foreground font-serif">Edit: {product.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <form action={cloneProduct}>
            <button type="submit" className="flex items-center gap-1 text-sm text-primary hover:bg-primary/5 px-3 py-2 rounded-xl transition-colors font-medium">
              Clone
            </button>
          </form>
          <form action={deleteProduct}>
            <SubmitButton variant="destructive-inline" label="Delete" pendingLabel="Deleting..." />
          </form>
        </div>
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
          defaultThemes={parseJsonSafe<string[]>((product as any).themes, [])}
          occasions={occasions.map(o => ({ slug: o.slug, name: o.name, image: o.image }))}
          recipientGroups={recipientGroups}
          themes={themes.map(t => ({ slug: t.slug, name: t.name }))}
        />

        {/* Size / Weight Variants */}
        <div data-section="variants">
        <VariantEditor
          defaultVariants={product.variants.map(v => ({ id: v.id, name: v.name, price: v.price, serves: v.serves || "" }))}
        />
        </div>

        {/* Flavours */}
        <FlavourEditor defaultFlavours={parseJsonSafe<string[]>((product as any).flavours, [])} />

        {/* Pricing Strategy */}
        <PricingStrategyEditor
          defaultStrategy={((product as any).pricingStrategy || "FIXED") as "FIXED" | "CUSTOM"}
          defaultDesignCharge={(product as any).designCharge || 0}
          defaultBase500gPrice={(product as any).base500gPrice || 300}
          defaultFlavourPrices={parseJsonSafe<{ name: string; price500g: number }[]>((product as any).flavourPrices, [])}
          defaultFlavour={(product as any).defaultFlavour || ""}
          defaultDiscountPct={(() => {
            if ((product as any).mrpPrice && (product as any).mrpPrice > product.basePrice) {
              return Math.round((1 - product.basePrice / (product as any).mrpPrice) * 100);
            }
            return 0;
          })()}
          flavours={parseJsonSafe<string[]>((product as any).flavours, [])}
        />

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
          <div className="grid grid-cols-2 gap-4" data-section="base-price">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Starting Price (₹)</label>
              <input name="basePrice" inputMode="decimal" defaultValue={product.basePrice} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
        <SubmitButton label="Save Changes" pendingLabel="Saving..." />
      </form>
    </div>
  );
}
