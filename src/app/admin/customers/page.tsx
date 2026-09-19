import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Users, Phone, Calendar, ShoppingCart } from "lucide-react";

export default async function AdminCustomersPage() {
  const customers = await db.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers.length} registered customers</p>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No customers yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {customers.map((customer) => (
              <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="px-4 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {(customer.name || customer.phone)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{customer.name || "—"}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {customer.phone}
                      </span>
                      {customer.email && <span>· {customer.email}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ShoppingCart className="w-3 h-3" />
                    {customer._count.orders} orders
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                    <Calendar className="w-3 h-3" />
                    Joined {new Date(customer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
