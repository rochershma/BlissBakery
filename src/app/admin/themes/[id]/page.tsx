import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { SubmitButton } from "@/components/admin/submit-button";
import { ImageField } from "@/components/admin/image-field";
import { requireAdmin } from "@/lib/server-utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditThemePage({ params }: Props) {
  const { id } = await params;
  const theme = await db.theme.findUnique({
    where: { id },
    include: { tags: { orderBy: { sortOrder: "asc" } } },
  });
  if (!theme) return notFound();

  async function updateTheme(formData: FormData) {
    "use server";
    await requireAdmin();
    const name = formData.get("name") as string;
    const subtitle = formData.get("subtitle") as string;
    const image = formData.get("image") as string;
    await db.theme.update({
      where: { id },
      data: { name, subtitle: subtitle || null, image: image || null },
    });
    revalidatePath("/admin/themes");
    revalidatePath("/");
    revalidatePath("/themes", "layout");
    redirect("/admin/themes");
  }

  async function addTag(formData: FormData) {
    "use server";
    await requireAdmin();
    const name = formData.get("name") as string;
    const image = formData.get("image") as string;
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const maxOrder = await db.themeTag.aggregate({ where: { themeId: id }, _max: { sortOrder: true } });
    await db.themeTag.create({
      data: { name, slug, image: image || null, sortOrder: (maxOrder._max.sortOrder || 0) + 1, themeId: id },
    });
    revalidatePath(`/admin/themes/${id}`);
    redirect(`/admin/themes/${id}`);
  }

  async function deleteTag(formData: FormData) {
    "use server";
    await requireAdmin();
    const tagId = formData.get("tagId") as string;
    await db.themeTag.delete({ where: { id: tagId } });
    revalidatePath(`/admin/themes/${id}`);
    redirect(`/admin/themes/${id}`);
  }

  async function updateTag(formData: FormData) {
    "use server";
    await requireAdmin();
    const tagId = formData.get("tagId") as string;
    const name = (formData.get("name") as string).trim();
    const image = formData.get("image") as string;
    if (!name) return;
    await db.themeTag.update({ where: { id: tagId }, data: { name, image: image || undefined } });
    revalidatePath(`/admin/themes/${id}`);
    revalidatePath("/");
    revalidatePath("/themes", "layout");
    redirect(`/admin/themes/${id}`);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/themes" className="p-1 rounded-full hover:bg-muted transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Edit: {theme.name}</h1>
          <p className="text-xs text-muted-foreground">/{theme.slug}</p>
        </div>
      </div>

      {/* Edit Theme Details */}
      <form action={updateTheme} className="max-w-2xl space-y-5 mb-8">
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-foreground font-serif">Theme Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Name *</label>
              <input name="name" required defaultValue={theme.name} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Subtitle</label>
              <input name="subtitle" defaultValue={theme.subtitle || ""} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Image</label>
            <ImageField name="image" defaultValue={theme.image || ""} label="Theme Image" folder="themes" />
          </div>
          <SubmitButton label="Save Changes" pendingLabel="Saving..." />
        </div>
      </form>

      {/* Sub-Categories (Tags) */}
      <div className="max-w-2xl">
        <h2 className="text-lg font-bold text-foreground font-serif mb-3">Sub-Categories</h2>
        <p className="text-xs text-muted-foreground mb-4">
          These appear as filter circles on the theme page. Example: under "Kids Cakes" → "Spiderman", "Unicorn", "Dinosaur" etc.
        </p>

        {theme.tags.length > 0 && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
            <div className="divide-y divide-border">
              {theme.tags.map((tag) => (
                <div key={tag.id} className="px-4 py-3">
                  <form action={updateTag}>
                    <input type="hidden" name="tagId" value={tag.id} />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 relative">
                        {tag.image ? (
                          <Image src={tag.image} alt={tag.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{tag.name[0]}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <input name="name" defaultValue={tag.name} className="w-full px-2 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
                        <p className="text-[10px] text-muted-foreground mt-1">slug: {tag.slug}</p>
                      </div>
                      <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex-shrink-0">
                        Save
                      </button>
                    </div>
                    <div className="ml-[52px] mt-2">
                      <ImageField name="image" defaultValue={tag.image || ""} label="Tag Image" folder="themes" />
                    </div>
                  </form>
                  <div className="ml-[52px] mt-1">
                    <form action={deleteTag} className="inline">
                      <input type="hidden" name="tagId" value={tag.id} />
                      <button type="submit" className="text-xs text-destructive hover:underline flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Tag */}
        <form action={addTag} className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Add Sub-Category
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Name *</label>
              <input name="name" required placeholder="e.g., Spiderman Cakes" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Image</label>
              <ImageField name="image" defaultValue="" label="Sub-Category Image" folder="themes" />
            </div>
          </div>
          <SubmitButton label="Add" pendingLabel="Adding..." />
        </form>
      </div>
    </div>
  );
}
