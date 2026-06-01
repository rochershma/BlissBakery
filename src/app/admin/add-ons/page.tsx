import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Plus, Save, Trash2, Gift } from "lucide-react";

export default async function AdminAddOnsPage() {
  const store = await db.store.findFirst();
  if (!store) return <p>No store found.</p>;

  const addOns = await db.storeAddOn.findMany({
    where: { storeId: store.id },
    orderBy: { sortOrder: "asc" },
  });

  async function createAddOn(formData: FormData) {
    "use server";
    const store = await db.store.findFirst();
    if (!store) return;
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const category = formData.get("category") as string;
    if (!name || !price) return;

    const maxOrder = await db.storeAddOn.aggregate({ where: { storeId: store.id }, _max: { sortOrder: true } });
    await db.storeAddOn.create({
      data: { name, price, category, sortOrder: (maxOrder._max.sortOrder || 0) + 1, storeId: store.id },
    });
    revalidatePath("/admin/add-ons");
    redirect("/admin/add-ons");
  }

  async function deleteAddOn(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await db.storeAddOn.delete({ where: { id } });
    revalidatePath("/admin/add-ons");
    redirect("/admin/add-ons");
  }

  async function toggleAddOn(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const current = formData.get("isActive") === "true";
    await db.storeAddOn.update({ where: { id }, data: { isActive: !current } });
    revalidatePath("/admin/add-ons");
    redirect("/admin/add-ons");
  }

  const categoryLabels: Record<string, string> = { ACCESSORY: "🔧 Accessory", DECORATION: "🎉 Decoration", GIFT: "🎁 Gift" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Store Add-Ons</h1>
          <p className="text-sm text-muted-foreground">Global add-ons shown on every product page & checkout. {addOns.length} items.</p>
        </div>
      </div>

      {/* Existing Add-Ons */}
      {addOns.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
          <div className="divide-y divide-border">
            {addOns.map((addon) => (
              <div key={addon.id} className={`px-4 py-3 flex items-center justify-between ${!addon.isActive ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">{addon.category === "GIFT" ? "🎁" : addon.category === "DECORATION" ? "🎉" : "🔧"}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{addon.name}</p>
                    <p className="text-xs text-muted-foreground">{categoryLabels[addon.category]} · {formatPrice(addon.price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <form action={toggleAddOn}>
                    <input type="hidden" name="id" value={addon.id} />
                    <input type="hidden" name="isActive" value={String(addon.isActive)} />
                    <button type="submit" className={`text-xs px-2 py-1 rounded-full ${addon.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {addon.isActive ? "Active" : "Inactive"}
                    </button>
                  </form>
                  <form action={deleteAddOn}>
                    <input type="hidden" name="id" value={addon.id} />
                    <button type="submit" className="p-1.5 rounded-lg text-destructive hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New */}
      <form action={createAddOn} className="bg-white rounded-2xl border border-primary/20 p-5 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Add New</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Name *</label>
            <input name="name" required placeholder="e.g., Birthday Candles" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Price (₹) *</label>
            <input name="price" inputMode="decimal" required placeholder="50" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Category</label>
            <select name="category" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="DECORATION">🎉 Decoration</option>
              <option value="ACCESSORY">🔧 Accessory</option>
              <option value="GIFT">🎁 Gift</option>
            </select>
          </div>
        </div>
        <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Add Add-On
        </button>
      </form>
    </div>
  );
}
