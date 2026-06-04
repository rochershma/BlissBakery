import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Plus, Save, Trash2, Eye, EyeOff } from "lucide-react";
import { ImageField } from "@/components/admin/image-field";
import { getSession } from "@/lib/auth";
import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) throw new Error("Forbidden");
}

export default async function AdminThemesPage() {
  const store = await db.store.findFirst();
  if (!store) return <p>No store found.</p>;

  const themes = await db.theme.findMany({
    where: { storeId: store.id },
    orderBy: { sortOrder: "asc" },
  });

  async function createTheme(formData: FormData) {
    "use server";
    await requireAdmin();
    const store = await db.store.findFirst();
    if (!store) return;
    const name = formData.get("name") as string;
    const subtitle = formData.get("subtitle") as string;
    const image = formData.get("image") as string;
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const maxOrder = await db.theme.aggregate({ where: { storeId: store.id }, _max: { sortOrder: true } });
    await db.theme.create({
      data: { name, slug, subtitle: subtitle || null, image: image || null, sortOrder: (maxOrder._max.sortOrder || 0) + 1, storeId: store.id },
    });
    revalidatePath("/admin/themes");
    redirect("/admin/themes");
  }

  async function deleteTheme(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = formData.get("id") as string;
    await db.theme.delete({ where: { id } });
    revalidatePath("/admin/themes");
    redirect("/admin/themes");
  }

  async function toggleTheme(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = formData.get("id") as string;
    const current = formData.get("isActive") === "true";
    await db.theme.update({ where: { id }, data: { isActive: !current } });
    revalidatePath("/admin/themes");
    redirect("/admin/themes");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Cake Themes</h1>
          <p className="text-sm text-muted-foreground">Manage theme collections (Bento, Photo, Kids, etc.) shown on homepage. {themes.length} themes.</p>
        </div>
      </div>

      {themes.length > 0 && (
        <div className="space-y-3 mb-6">
          {themes.map((theme) => (
            <div key={theme.id} className={`bg-white rounded-2xl border border-border overflow-hidden ${!theme.isActive ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-4 p-4">
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
                  {theme.image ? (
                    <Image src={theme.image} alt={theme.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xl font-serif text-primary">{theme.name[0]}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-sm text-foreground">{theme.name}</h3>
                  {theme.subtitle && <p className="text-xs text-muted-foreground truncate">{theme.subtitle}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">/{theme.slug}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <form action={toggleTheme}>
                    <input type="hidden" name="id" value={theme.id} />
                    <input type="hidden" name="isActive" value={String(theme.isActive)} />
                    <button type="submit" className={`p-2 rounded-lg transition-colors ${theme.isActive ? "text-green-600 hover:bg-green-50" : "text-muted-foreground hover:bg-muted"}`}>
                      {theme.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </form>
                  <ConfirmDeleteForm action={deleteTheme} confirmMessage={`Delete "${theme.name}"?`} hiddenInputs={{ id: theme.id }}>
                    <button type="submit" className="p-2 rounded-lg text-destructive hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </ConfirmDeleteForm>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form action={createTheme} className="bg-white rounded-2xl border border-primary/20 p-5 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2 font-serif"><Plus className="w-4 h-4 text-primary" /> Add New Theme</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Name *</label>
            <input name="name" required placeholder="e.g., Bento Cake" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Subtitle</label>
            <input name="subtitle" placeholder="Short description..." className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <ImageField name="image" defaultValue="" label="Theme Image" folder="themes" />
        <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Add Theme
        </button>
      </form>
    </div>
  );
}
