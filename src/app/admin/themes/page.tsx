import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, Eye, EyeOff, Pencil } from "lucide-react";
import { SubmitButton } from "@/components/admin/submit-button";
import { ImageField } from "@/components/admin/image-field";
import { getSession } from "@/lib/auth";
import { SubmitIcon } from "@/components/admin/submit-icon";
import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) throw new Error("Forbidden");
}

interface Props {
  searchParams: Promise<{ edit?: string }>;
}

export default async function AdminThemesPage({ searchParams }: Props) {
  const { edit: editId } = await searchParams;
  const store = await db.store.findFirst();
  if (!store) return <p>No store found.</p>;

  const themes = await db.theme.findMany({
    where: { storeId: store.id },
    orderBy: { sortOrder: "asc" },
  });

  const editingTheme = editId ? themes.find(t => t.id === editId) : null;

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
    revalidatePath("/");
    revalidatePath("/themes", "layout");
    redirect("/admin/themes");
  }

  async function updateTheme(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const subtitle = formData.get("subtitle") as string;
    const image = formData.get("image") as string;
    if (!name.trim()) return;
    await db.theme.update({
      where: { id },
      data: { name, subtitle: subtitle || null, image: image || null },
    });
    revalidatePath("/admin/themes");
    revalidatePath("/");
    revalidatePath("/themes", "layout");
    redirect("/admin/themes");
  }

  async function deleteTheme(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = formData.get("id") as string;
    await db.theme.delete({ where: { id } });
    revalidatePath("/admin/themes");
    revalidatePath("/");
    revalidatePath("/themes", "layout");
    redirect("/admin/themes");
  }

  async function toggleTheme(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = formData.get("id") as string;
    const current = formData.get("isActive") === "true";
    await db.theme.update({ where: { id }, data: { isActive: !current } });
    revalidatePath("/admin/themes");
    revalidatePath("/");
    revalidatePath("/themes", "layout");
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
                  <a href={`/admin/themes?edit=${theme.id}`} className="p-2 rounded-lg text-primary hover:bg-primary/5 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </a>
                  <form action={toggleTheme}>
                    <input type="hidden" name="id" value={theme.id} />
                    <input type="hidden" name="isActive" value={String(theme.isActive)} />
                    <SubmitIcon className={`p-2 rounded-lg transition-colors ${theme.isActive ? "text-green-600 hover:bg-green-50" : "text-muted-foreground hover:bg-muted"}`}>
                      {theme.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </SubmitIcon>
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

      {/* Edit Theme Form */}
      {editingTheme && (
        <form action={updateTheme} className="bg-white rounded-2xl border-2 border-primary/30 p-5 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2 font-serif"><Pencil className="w-4 h-4 text-primary" /> Edit Theme: {editingTheme.name}</h2>
            <a href="/admin/themes" className="text-xs text-muted-foreground hover:text-foreground">Cancel</a>
          </div>
          <input type="hidden" name="id" value={editingTheme.id} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Name *</label>
              <input name="name" required defaultValue={editingTheme.name} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Subtitle</label>
              <input name="subtitle" defaultValue={editingTheme.subtitle || ""} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <ImageField name="image" defaultValue={editingTheme.image || ""} label="Theme Image" folder="themes" />
          <SubmitButton label="Save Changes" pendingLabel="Saving..." className="w-full" />
        </form>
      )}

      {/* Add New Theme */}
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
        <SubmitButton label="Add Theme" pendingLabel="Creating..." className="w-full" />
      </form>
    </div>
  );
}
