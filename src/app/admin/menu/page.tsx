import { db } from "@/lib/db";
import { formatPrice, parseJsonSafe } from "@/lib/utils";
import Link from "next/link";
import { Plus, Edit, Eye, EyeOff } from "lucide-react";
import { AdminMenuClient } from "./admin-menu-client";
import { SubmitButton } from "@/components/admin/submit-button";
import { requireActiveStore, listStores } from "@/lib/active-store";
import { requireAdmin } from "@/lib/server-utils";
import { copyMenu, copyStoreSetup } from "@/lib/copy-menu";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ copied?: string }>;
}) {
  const { copied } = await searchParams;
  const store = await requireActiveStore();
  const otherStores = (await listStores()).filter((s) => s.id !== store.id);

  async function importMenu(formData: FormData) {
    "use server";
    await requireAdmin();
    const from = formData.get("fromStoreId") as string;
    const target = await requireActiveStore();
    const { categories, products } = await copyMenu(from, target.id);
    // A menu on its own renders a bare homepage, so bring the rest across too.
    const setup = await copyStoreSetup(from, target.id);
    const extras = [
      setup.banners ? `${setup.banners} banners` : "",
      setup.addOns ? `${setup.addOns} add-ons` : "",
      setup.occasions ? `${setup.occasions} occasions` : "",
      setup.themes ? `${setup.themes} themes` : "",
    ].filter(Boolean);
    revalidatePath("/admin/menu");
    revalidatePath("/", "layout");
    const summary = [`${categories} categories`, `${products} products`, ...extras].join(", ");
    redirect(`/admin/menu?copied=${summary}`);
  }

  const categories = await db.category.findMany({
    where: { storeId: store.id },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        orderBy: { name: "asc" },
        include: { variants: true },
      },
    },
  });

  const totalProducts = categories.reduce((sum, c) => sum + c.products.length, 0);

  const data = categories.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    isVisible: c.isVisible,
    products: c.products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDesc: p.shortDesc,
      basePrice: p.basePrice,
      isBestseller: p.isBestseller,
      isNew: p.isNew,
      isAvailable: p.isAvailable,
      variantCount: p.variants.length,
      image: (() => { try { const imgs = JSON.parse(p.images as string); return Array.isArray(imgs) ? imgs[0] : null; } catch { return null; } })(),
    })),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Menu Management</h1>
          <p className="text-sm text-muted-foreground">
            {store.name} · {categories.filter(c => c.products.length > 0).length} categories · {totalProducts} products
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/menu/categories/new"
            className="flex items-center gap-1 bg-white border border-border px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" /> Category
          </Link>
          <Link
            href="/admin/menu/products/new"
            className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" /> Product
          </Link>
        </div>
      </div>

      {copied ? (
        <p className="mb-5 rounded-lg border border-success/30 bg-success/5 px-4 py-2.5 text-sm text-success">
          Copied {copied}.
        </p>
      ) : null}

      {otherStores.length > 0 ? (
        <form
          action={importMenu}
          className={`mb-6 flex flex-wrap items-end gap-3 rounded-xl border p-4 ${
            totalProducts === 0 ? "border-primary/40 bg-primary/5" : "border-border bg-white"
          }`}
        >
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs font-medium text-foreground block mb-1">
              {totalProducts === 0 ? `${store.name} has no menu yet` : "Copy a setup from another outlet"}
            </label>
            <select name="fromStoreId" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
              {otherStores.map((s) => (
                <option key={s.id} value={s.id}>Copy from {s.name}</option>
              ))}
            </select>
          </div>
          <SubmitButton label="Copy menu" pendingLabel="Copying..." />
          <p className="w-full text-[10px] text-muted-foreground">
            Copies the menu plus banners, add-ons, occasions and themes — copied, not shared, so {store.name} can then
            set its own prices and hide items. Anything this outlet already has is left alone.
          </p>
        </form>
      ) : null}

      <AdminMenuClient categories={data} />
    </div>
  );
}
