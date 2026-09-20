import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubmitButton } from "@/components/admin/submit-button";
import { listStores } from "@/lib/active-store";
import { requireAdmin } from "@/lib/server-utils";
import { readPromoForm } from "@/lib/promo-form";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditPromoPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const [promo, stores] = await Promise.all([
    db.promoCode.findUnique({ where: { id } }),
    listStores(),
  ]);
  if (!promo) return notFound();

  async function updatePromo(formData: FormData) {
    "use server";
    await requireAdmin();
    const data = readPromoForm(formData, `/admin/promos/${id}`);

    const clash = await db.promoCode.findUnique({ where: { code: data.code }, select: { id: true } });
    if (clash && clash.id !== id) {
      redirect(`/admin/promos/${id}?error=${encodeURIComponent(`${data.code} already exists`)}`);
    }

    await db.promoCode.update({ where: { id }, data });
    revalidatePath("/admin/promos");
    redirect("/admin/promos");
  }

  async function deletePromo() {
    "use server";
    await requireAdmin();
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
          <SubmitButton variant="destructive-inline" label="Delete" pendingLabel="Deleting..." />
        </form>
      </div>

      <form action={updatePromo} className="max-w-2xl space-y-5">
        {error ? (
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">{error}</p>
        ) : null}
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

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Applies To</label>
            <select name="storeId" defaultValue={promo.storeId ?? ""} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
              <option value="">All stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
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
              <input name="discountValue" inputMode="decimal" required defaultValue={promo.discountValue} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Min Order Value (₹)</label>
              <input name="minOrderValue" inputMode="decimal" defaultValue={promo.minOrderValue || ""} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Max Discount (₹)</label>
              <input name="maxDiscount" inputMode="decimal" defaultValue={promo.maxDiscount || ""} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
              <input name="usageLimit" inputMode="numeric" defaultValue={promo.usageLimit || ""} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Per User Limit</label>
              <input name="perUserLimit" inputMode="numeric" defaultValue={promo.perUserLimit || ""} className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
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

        <SubmitButton label="Save Changes" pendingLabel="Saving..." />
      </form>
    </div>
  );
}
