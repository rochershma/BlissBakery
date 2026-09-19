import { db } from "@/lib/db";
import { AddOnManager } from "./addon-manager";

export default async function AdminAddOnsPage() {
  const store = await db.store.findFirst();
  if (!store) return <p>No store found.</p>;

  const addOns = await db.storeAddOn.findMany({
    where: { storeId: store.id },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Store Add-Ons</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gifts, decorations & extras shown after add-to-cart. Upload images for best results.
          </p>
        </div>
      </div>

      <AddOnManager
        initialAddOns={addOns.map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
          image: a.image,
          category: a.category,
          isActive: a.isActive,
          sortOrder: a.sortOrder,
        }))}
      />
    </div>
  );
}
