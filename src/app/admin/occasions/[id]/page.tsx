import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Trash2, Plus, Pencil } from "lucide-react";
import { SubmitButton } from "@/components/admin/submit-button";
import { ImageField } from "@/components/admin/image-field";
import { requireAdmin } from "@/lib/server-utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditOccasionPage({ params }: Props) {
  const { id } = await params;
  const occasion = await db.occasion.findUnique({
    where: { id },
    include: { recipients: { orderBy: { sortOrder: "asc" } } },
  });
  if (!occasion) return notFound();

  async function updateOccasion(formData: FormData) {
    "use server";
    await requireAdmin();
    const name = formData.get("name") as string;
    const subtitle = formData.get("subtitle") as string;
    const image = formData.get("image") as string;
    await db.occasion.update({
      where: { id },
      data: { name, subtitle: subtitle || null, image: image || null },
    });
    revalidatePath("/admin/occasions");
    revalidatePath("/");
    revalidatePath("/cakes", "layout");
    redirect("/admin/occasions");
  }

  async function addRecipient(formData: FormData) {
    "use server";
    await requireAdmin();
    const name = formData.get("name") as string;
    const image = formData.get("image") as string;
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^for-/, "");
    const maxOrder = await db.recipient.aggregate({ where: { occasionId: id }, _max: { sortOrder: true } });
    await db.recipient.create({
      data: { name, slug, image: image || null, sortOrder: (maxOrder._max.sortOrder || 0) + 1, occasionId: id },
    });
    revalidatePath(`/admin/occasions/${id}`);
    redirect(`/admin/occasions/${id}`);
  }

  async function deleteRecipient(formData: FormData) {
    "use server";
    await requireAdmin();
    const recipientId = formData.get("recipientId") as string;
    await db.recipient.delete({ where: { id: recipientId } });
    revalidatePath(`/admin/occasions/${id}`);
    redirect(`/admin/occasions/${id}`);
  }

  async function updateRecipient(formData: FormData) {
    "use server";
    await requireAdmin();
    const recipientId = formData.get("recipientId") as string;
    const name = (formData.get("name") as string).trim();
    if (!name) return;
    await db.recipient.update({ where: { id: recipientId }, data: { name } });
    revalidatePath(`/admin/occasions/${id}`);
    redirect(`/admin/occasions/${id}`);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/occasions" className="p-1 rounded-full hover:bg-muted transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Edit: {occasion.name}</h1>
          <p className="text-xs text-muted-foreground">/{occasion.slug}</p>
        </div>
      </div>

      {/* Edit Occasion */}
      <form action={updateOccasion} className="max-w-2xl space-y-5 mb-8">
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-foreground font-serif">Occasion Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Name *</label>
              <input name="name" required defaultValue={occasion.name} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Subtitle</label>
              <input name="subtitle" defaultValue={occasion.subtitle || ""} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Image</label>
            <ImageField name="image" defaultValue={occasion.image || ""} label="Occasion Image" folder="occasions" />
          </div>
          <SubmitButton label="Save Changes" pendingLabel="Saving..." />
        </div>
      </form>

      {/* Recipients ("For Whom") */}
      <div className="max-w-2xl">
        <h2 className="text-lg font-bold text-foreground font-serif mb-3">Recipients (For Whom)</h2>
        <p className="text-xs text-muted-foreground mb-4">These filters appear on the occasion page. Customers click "For Wife", "For Kids" etc. to filter cakes.</p>

        {occasion.recipients.length > 0 && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
            <div className="divide-y divide-border">
              {occasion.recipients.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 relative">
                    {r.image ? (
                      <Image src={r.image} alt={r.name} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{r.name[0]}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">slug: {r.slug}</p>
                  </div>
                  <form action={updateRecipient} className="flex items-center gap-1">
                    <input type="hidden" name="recipientId" value={r.id} />
                    <input name="name" defaultValue={r.name} className="w-28 px-2 py-1 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    <button type="submit" className="p-1.5 rounded-lg text-primary hover:bg-primary/5 transition-colors" title="Save">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </form>
                  <form action={deleteRecipient}>
                    <input type="hidden" name="recipientId" value={r.id} />
                    <button type="submit" className="p-1.5 rounded-lg text-destructive hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Recipient */}
        <form action={addRecipient} className="bg-white rounded-2xl border border-primary/20 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-primary" /> Add Recipient Filter</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Name *</label>
              <input name="name" required placeholder="e.g., For Sister" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <ImageField name="image" defaultValue="" label="Recipient Image" folder="occasions" />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
      </div>
    </div>
  );
}
