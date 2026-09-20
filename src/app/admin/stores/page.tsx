import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, Trash2, Plus, Settings as SettingsIcon } from "lucide-react";
import { SubmitButton } from "@/components/admin/submit-button";
import { requireAdmin, sanitizeMax } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export default async function AdminStoresPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const stores = await db.store.findMany({ orderBy: { createdAt: "asc" } });
  const counts = await db.order.groupBy({ by: ["storeId"], _count: { _all: true } });
  const orderCount = new Map(counts.map((c) => [c.storeId, c._count._all]));

  async function createStore(formData: FormData) {
    "use server";
    await requireAdmin();

    const name = sanitizeMax(formData.get("name") as string, 100);
    if (!name) redirect("/admin/stores?error=Store+name+is+required");

    const city = sanitizeMax(formData.get("city") as string, 60) || "";
    const base = slugify((formData.get("slug") as string) || name) || "store";

    // Slugs are public URLs, so make sure we never collide with an existing one.
    let slug = base;
    for (let n = 2; await db.store.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;

    await db.store.create({
      data: {
        name,
        slug,
        city,
        state: sanitizeMax(formData.get("state") as string, 60) || "",
        address: sanitizeMax(formData.get("address") as string, 200) || "",
        pincode: sanitizeMax(formData.get("pincode") as string, 10) || "",
        phone: sanitizeMax(formData.get("phone") as string, 20) || "",
        isOpen: true,
      },
    });

    revalidatePath("/admin/stores");
    revalidatePath("/", "layout");
    redirect("/admin/stores");
  }

  async function deleteStore(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = formData.get("id") as string;

    const total = await db.store.count();
    if (total <= 1) redirect("/admin/stores?error=You+cannot+delete+the+only+store");

    const orders = await db.order.count({ where: { storeId: id } });
    if (orders > 0) {
      redirect(`/admin/stores?error=This+store+has+${orders}+orders.+Close+it+instead+of+deleting.`);
    }

    await db.store.delete({ where: { id } });
    revalidatePath("/admin/stores");
    revalidatePath("/", "layout");
    redirect("/admin/stores");
  }

  async function toggleOpen(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = formData.get("id") as string;
    const store = await db.store.findUnique({ where: { id }, select: { isOpen: true } });
    if (!store) redirect("/admin/stores?error=Store+not+found");

    await db.store.update({ where: { id }, data: { isOpen: !store.isOpen } });
    revalidatePath("/admin/stores");
    revalidatePath("/", "layout");
    redirect("/admin/stores");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground font-serif mb-6">Stores</h1>

      {error ? (
        <p className="mb-5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="max-w-3xl space-y-3">
        {stores.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {s.name}
                <span className="ml-2 text-[10px] font-normal text-muted-foreground">/{s.slug}</span>
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {[s.city, s.pincode].filter(Boolean).join(" · ") || "No address yet"}
                <span className="ml-2">{orderCount.get(s.id) ?? 0} orders</span>
              </p>
            </div>

            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                s.isOpen ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              }`}
            >
              {s.isOpen ? "Open" : "Closed"}
            </span>

            <form action={toggleOpen}>
              <input type="hidden" name="id" value={s.id} />
              <button type="submit" className="text-xs font-medium text-primary hover:underline">
                {s.isOpen ? "Close" : "Open"}
              </button>
            </form>

            <Link
              href="/admin/settings"
              className="p-2 text-muted-foreground hover:text-primary"
              aria-label={`Settings for ${s.name}`}
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>

            <form action={deleteStore}>
              <input type="hidden" name="id" value={s.id} />
              <button
                type="submit"
                className="p-2 text-muted-foreground hover:text-danger"
                aria-label={`Delete ${s.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </form>
          </div>
        ))}
      </div>

      <form action={createStore} className="max-w-3xl mt-8 bg-white rounded-xl border border-border p-5 space-y-4">
        <h2 className="label-premium text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Add a Store
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Store Name</label>
            <input name="name" required maxLength={100} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">URL Slug <span className="text-muted-foreground">(optional)</span></label>
            <input name="slug" placeholder="auto-generated from the name" maxLength={60} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Address</label>
            <input name="address" maxLength={200} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">City</label>
            <input name="city" maxLength={60} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">State</label>
            <input name="state" maxLength={60} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Pincode</label>
            <input name="pincode" inputMode="numeric" maxLength={10} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Phone</label>
            <input name="phone" inputMode="tel" maxLength={20} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <SubmitButton label="Create Store" pendingLabel="Creating..." />
        <p className="text-[10px] text-muted-foreground">
          Charges, hours, slots and tax are configured per store under Settings.
        </p>
      </form>
    </div>
  );
}
