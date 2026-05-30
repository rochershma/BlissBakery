import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Plus, Tag, Calendar, ToggleLeft, ToggleRight } from "lucide-react";

export default async function AdminPromosPage() {
  const promos = await db.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Promo Codes</h1>
          <p className="text-sm text-muted-foreground">{promos.length} promo codes</p>
        </div>
        <Link
          href="/admin/promos/new"
          className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors btn-press"
        >
          <Plus className="w-4 h-4" /> New Promo
        </Link>
      </div>

      {promos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Tag className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No promo codes yet. Create one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promos.map((promo) => {
            const isExpired = new Date(promo.validTo) < new Date();
            return (
              <div key={promo.id} className={`bg-white rounded-2xl border overflow-hidden ${isExpired ? "border-red-200 opacity-60" : "border-border"}`}>
                <div className={`p-4 text-white ${promo.isActive && !isExpired ? "bg-gradient-to-r from-primary to-accent" : "bg-gray-400"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold">
                        {promo.discountType === "PERCENTAGE" ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`}
                      </p>
                      {promo.minOrderValue && <p className="text-sm text-white/80">Min order: ₹{promo.minOrderValue}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {promo.isActive ? (
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">LIVE</span>
                      ) : (
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">PAUSED</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-foreground tracking-wider">{promo.code}</span>
                    {promo.occasionTag && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{promo.occasionTag}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(promo.validFrom).toLocaleDateString()} – {new Date(promo.validTo).toLocaleDateString()}
                    </span>
                    <span>Used: {promo.usedCount}{promo.usageLimit ? `/${promo.usageLimit}` : ""}</span>
                  </div>
                  {isExpired && <p className="text-xs text-destructive font-medium mt-1">Expired</p>}
                  <Link href={`/admin/promos/${promo.id}`} className="mt-2 inline-block text-xs text-primary font-medium hover:underline">Edit Promo →</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
