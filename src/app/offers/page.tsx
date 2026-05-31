import { db } from "@/lib/db";
import { SiteHeader } from "@/components/shared/site-header";
import { Tag, Copy, Lock } from "lucide-react";

export default async function OffersPage() {
  const promos = await db.promoCode.findMany({
    where: { isActive: true, validTo: { gte: new Date() } },
    orderBy: { discountValue: "desc" },
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-gradient-to-br from-primary/10 via-primary-light to-secondary py-12 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 font-serif">🎉 Offers &amp; Promo Codes</h1>
          <p className="text-muted-foreground">Save more on your favourite treats</p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-8 page-enter">
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground bg-primary/5 rounded-xl px-4 py-2.5">
          <Lock className="w-4 h-4 text-primary" />
          <span>Login to apply promo codes at checkout</span>
        </div>

        {promos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎫</div>
            <h2 className="text-xl font-bold text-foreground font-serif mb-2">No active offers</h2>
            <p className="text-muted-foreground">Check back soon for exciting deals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
            {promos.map((promo) => (
              <div key={promo.id} className="product-card bg-white rounded-2xl border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {promo.discountType === "PERCENTAGE"
                          ? `${promo.discountValue}% OFF`
                          : `₹${promo.discountValue} OFF`}
                      </p>
                      {promo.minOrderValue && (
                        <p className="text-sm text-white/80">on orders above ₹{promo.minOrderValue}</p>
                      )}
                    </div>
                    {promo.occasionTag && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{promo.occasionTag}</span>
                    )}
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="font-mono font-bold text-foreground tracking-wider">{promo.code}</span>
                  </div>
                  <button className="add-btn flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-semibold">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                {promo.maxDiscount && promo.discountType === "PERCENTAGE" && (
                  <p className="px-4 pb-3 text-xs text-muted-foreground">Max discount: ₹{promo.maxDiscount}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
