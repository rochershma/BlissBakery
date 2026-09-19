import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubmitButton } from "@/components/admin/submit-button";

export default function NewPromoPage() {
  async function createPromo(formData: FormData) {
    "use server";
    const code = (formData.get("code") as string).toUpperCase().replace(/\s/g, "");
    const discountType = formData.get("discountType") as string;
    const discountValue = parseFloat(formData.get("discountValue") as string);
    const minOrderValue = parseFloat(formData.get("minOrderValue") as string) || null;
    const maxDiscount = parseFloat(formData.get("maxDiscount") as string) || null;
    const validFrom = new Date(formData.get("validFrom") as string);
    const validTo = new Date(formData.get("validTo") as string);
    const usageLimit = parseInt(formData.get("usageLimit") as string) || null;
    const perUserLimit = parseInt(formData.get("perUserLimit") as string) || 1;
    const occasionTag = formData.get("occasionTag") as string || null;
    const isActive = formData.get("isActive") === "on";

    await db.promoCode.create({
      data: { code, discountType, discountValue, minOrderValue, maxDiscount, validFrom, validTo, usageLimit, perUserLimit, occasionTag, isActive },
    });
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
