import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Plus, Trash2, Eye, EyeOff, ChevronRight } from "lucide-react";
import { SubmitButton } from "@/components/admin/submit-button";
import { ImageField } from "@/components/admin/image-field";
import { getSession } from "@/lib/auth";
import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) throw new Error("Forbidden");
}

export default async function AdminOccasionsPage() {
  const store = await db.store.findFirst();
  if (!store) return <p>No store found.</p>;

  const occasions = await db.occasion.findMany({
    where: { storeId: store.id },
    orderBy: { sortOrder: "asc" },
    include: { recipients: { orderBy: { sortOrder: "asc" } } },
  });

  async function createOccasion(formData: FormData) {
    "use server";
    await requireAdmin();
    const store = await db.store.findFirst();
    if (!store) return;
    const name = formData.get("name") as string;
    const subtitle = formData.get("subtitle") as string;
    const image = formData.get("image") as string;
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const maxOrder = await db.occasion.aggregate({ where: { storeId: store.id }, _max: { sortOrder: true } });
    await db.occasion.create({
      data: { name, slug, subtitle: subtitle || null, image: image || null, sortOrder: (maxOrder._max.sortOrder || 0) + 1, storeId: store.id },
    });
    revalidatePath("/admin/occasions");
    redirect("/admin/occasions");
  }

  async function deleteOccasion(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = formData.get("id") as string;
    await db.occasion.delete({ where: { id } });
    revalidatePath("/admin/occasions");
    redirect("/admin/occasions");
  }

  async function toggleOccasion(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = formData.get("id") as string;
    const current = formData.get("isActive") === "true";
    await db.occasion.update({ where: { id }, data: { isActive: !current } });
    revalidatePath("/admin/occasions");
    redirect("/admin/occasions");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Occasions</h1>
          <p className="text-sm text-muted-foreground">Manage occasion categories shown on homepage & occasion pages. {occasions.length} occasions.</p>
        </div>
      </div>

      {/* Existing Occasions */}
      {occasions.length > 0 && (
        <div className="space-y-3 mb-6">
          {occasions.map((occ) => (
            <div key={occ.id} className={`bg-white rounded-2xl border border-border overflow-hidden ${!occ.isActive ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-4 p-4">
                {/* Image */}
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
                  {occ.image ? (
                    <Image src={occ.image} alt={occ.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xl font-serif text-primary">{occ.name[0]}</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-sm text-foreground">{occ.name}</h3>
                  {occ.subtitle && <p className="text-xs text-muted-foreground truncate">{occ.subtitle}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    /{occ.slug} · {occ.recipients.length} recipient filters
                  </p>
                  {occ.recipients.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {occ.recipients.map(r => (
                        <span key={r.id} className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{r.name}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link href={`/admin/occasions/${occ.id}`} className="p-2 rounded-lg text-primary hover:bg-primary/5 transition-colors text-xs font-medium">
                    Edit <ChevronRight className="w-3 h-3 inline" />
                  </Link>
                  <form action={toggleOccasion}>
                    <input type="hidden" name="id" value={occ.id} />
                    <input type="hidden" name="isActive" value={String(occ.isActive)} />
                    <button type="submit" className={`p-2 rounded-lg transition-colors ${occ.isActive ? "text-green-600 hover:bg-green-50" : "text-muted-foreground hover:bg-muted"}`}>
                      {occ.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </form>
                  <ConfirmDeleteForm action={deleteOccasion} confirmMessage={`Delete "${occ.name}" and all its recipients?`} hiddenInputs={{ id: occ.id }}>
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

      {/* Add New Occasion */}
      <form action={createOccasion} className="bg-white rounded-2xl border border-primary/20 p-5 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2 font-serif"><Plus className="w-4 h-4 text-primary" /> Add New Occasion</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Name *</label>
            <input name="name" required placeholder="e.g., Valentine's Day Cakes" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Subtitle</label>
            <input name="subtitle" placeholder="Short description..." className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <ImageField name="image" defaultValue="" label="Occasion Image" folder="occasions" />
        <SubmitButton label="Add Occasion" pendingLabel="Creating..." />
      </form>
    </div>
  );
}
