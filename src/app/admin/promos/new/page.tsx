import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubmitButton } from "@/components/admin/submit-button";
import { listStores, getActiveStoreId } from "@/lib/active-store";
import { requireAdmin } from "@/lib/server-utils";
import { readPromoForm } from "@/lib/promo-form";

export default async function NewPromoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [stores, activeStoreId] = await Promise.all([listStores(), getActiveStoreId()]);

  async function createPromo(formData: FormData) {
    "use server";
    await requireAdmin();
    const data = readPromoForm(formData, "/admin/promos/new");

    const clash = await db.promoCode.findUnique({ where: { code: data.code }, select: { id: true } });
    if (clash) redirect(`/admin/promos/new?error=${encodeURIComponent(`${data.code} already exists`)}`);

    await db.promoCode.create({ data });
    revalidatePath("/admin/promos");
    redirect("/admin/promos");
  }

  const today = new Date().toISOString().split("T")[0];
  const threeMonths = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/promos" className="p-1 rounded-full hover:bg-muted transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-foreground font-serif">New Promo Code</h1>
      </div>
      {error ? (
        <p className="mb-5 max-w-2xl rounded-lg border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">{error}</p>
      ) : null}
      <form action={createPromo} className="max-w-2xl space-y-5">
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Promo Code *</label>
              <input name="code" required placeholder="e.g. WELCOME10" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Occasion Tag</label>
              <input name="occasionTag" placeholder="e.g. Diwali, Birthday" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Applies To</label>
            <select name="storeId" defaultValue={activeStoreId ?? ""} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">All stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Discount Type *</label>
              <select name="discountType" required className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Discount Value *</label>
              <input name="discountValue" inputMode="decimal" required placeholder="10" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Min Order Value (₹)</label>
              <input name="minOrderValue" inputMode="decimal" placeholder="300" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Max Discount (₹)</label>
              <input name="maxDiscount" inputMode="decimal" placeholder="100" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Valid From *</label>
              <input name="validFrom" type="date" required defaultValue={today} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Valid To *</label>
              <input name="validTo" type="date" required defaultValue={threeMonths} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Total Usage Limit</label>
              <input name="usageLimit" inputMode="numeric" placeholder="1000" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Per User Limit</label>
              <input name="perUserLimit" inputMode="numeric" defaultValue={1} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="isActive" defaultChecked className="w-4 h-4 accent-primary" />
            🟢 Go Live immediately
          </label>
        </div>
        <SubmitButton label="Create Promo Code" pendingLabel="Creating..." />
      </form>
    </div>
  );
}
