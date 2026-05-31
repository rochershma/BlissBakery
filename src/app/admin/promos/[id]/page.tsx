import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPromoPage({ params }: Props) {
  const { id } = await params;
  const promo = await db.promoCode.findUnique({ where: { id } });
  if (!promo) return notFound();

  async function updatePromo(formData: FormData) {
    "use server";
    const code = (formData.get("code") as string).toUpperCase().trim();
    const discountType = formData.get("discountType") as string;
    const discountValue = parseFloat(formData.get("discountValue") as string);
    const minOrderValue = parseFloat(formData.get("minOrderValue") as string) || null;
    const maxDiscount = parseFloat(formData.get("maxDiscount") as string) || null;
    const validFrom = new Date(formData.get("validFrom") as string);
    const validTo = new Date(formData.get("validTo") as string);
    const usageLimit = parseInt(formData.get("usageLimit") as string) || undefined;
    const perUserLimit = parseInt(formData.get("perUserLimit") as string) || undefined;
    const occasionTag = (formData.get("occasionTag") as string) || null;
    const isActive = formData.get("isActive") === "on";

    await db.promoCode.update({
      where: { id },
      data: { code, discountType, discountValue, minOrderValue, maxDiscount, validFrom, validTo, usageLimit, perUserLimit, occasionTag, isActive },
    });
    revalidatePath("/admin/promos");
    redirect("/admin/promos");
  }

  async function deletePromo() {
    "use server";
    await db.promoCode.delete({ where: { id } });
    revalidatePath("/admin/promos");
    redirect("/admin/promos");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/promos" className="p-1 rounded-full hover:bg-muted transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-2xl font-bold text-foreground font-serif">Edit: {promo.code}</h1>
        </div>
        <form action={deletePromo}>
          <button type="submit" className="flex items-center gap-1 text-sm text-destructive hover:bg-red-50 px-3 py-2 rounded-xl transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </form>
      </div>

      <form action={updatePromo} className="max-w-2xl space-y-5">
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Promo Code *</label>
              <input name="code" required defaultValue={promo.code} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono uppercase" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Occasion Tag</label>
              <input name="occasionTag" defaultValue={promo.occasionTag || ""} placeholder="e.g. Diwali, Birthday" className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Discount Type *</label>
              <select name="discountType" required defaultValue={promo.discountType} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Discount Value *</label>
              <input name="discountValue" type="number" step="0.01" required defaultValue={promo.discountValue} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Min Order Value (₹)</label>
              <input name="minOrderValue" type="number" step="0.01" defaultValue={promo.minOrderValue || ""} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Max Discount (₹)</label>
              <input name="maxDiscount" type="number" step="0.01" defaultValue={promo.maxDiscount || ""} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Valid From *</label>
              <input name="validFrom" type="date" required defaultValue={promo.validFrom.toISOString().split("T")[0]} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Valid To *</label>
              <input name="validTo" type="date" required defaultValue={promo.validTo.toISOString().split("T")[0]} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Total Usage Limit</label>
              <input name="usageLimit" type="number" defaultValue={promo.usageLimit || ""} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Per User Limit</label>
              <input name="perUserLimit" type="number" defaultValue={promo.perUserLimit || ""} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="isActive" defaultChecked={promo.isActive} className="w-4 h-4 accent-primary" />
            🟢 Active (Go Live)
          </label>

          <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
            Used {promo.usedCount} times · Created {promo.createdAt.toLocaleDateString("en-IN")}
          </div>
        </div>

        <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors btn-press flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> Save Changes
        </button>
      </form>
    </div>
  );
}
