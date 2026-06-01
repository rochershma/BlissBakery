"use client";

import { useMemo, useState } from "react";
import { MultiImagePicker } from "@/components/admin/multi-image-picker";
import { Check, Tag, Users } from "lucide-react";

interface OccasionTag {
  slug: string;
  name: string;
  image?: string | null;
}

interface RecipientTag {
  slug: string;
  name: string;
  image?: string | null;
}

interface RecipientGroup {
  occasionSlug: string;
  recipients: RecipientTag[];
}

interface Props {
  defaultImages: string[];
  defaultOccasions: string[];
  defaultForWhom: string[];
  occasions: OccasionTag[];
  recipientGroups: RecipientGroup[];
}

export function ProductFormFields({
  defaultImages,
  defaultOccasions,
  defaultForWhom,
  occasions,
  recipientGroups,
}: Props) {
  const [images, setImages] = useState<string[]>(defaultImages);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(defaultOccasions);
  const [selectedForWhom, setSelectedForWhom] = useState<string[]>(defaultForWhom);

  const recipientGroupsByOccasion = useMemo(
    () => new Map(recipientGroups.map((group) => [group.occasionSlug, group.recipients])),
    [recipientGroups]
  );

  const selectedRecipientUniverse = useMemo(() => {
    const allowed = new Set<string>();
    selectedOccasions.forEach((occasionSlug) => {
      (recipientGroupsByOccasion.get(occasionSlug) || []).forEach((recipient) => {
        allowed.add(recipient.slug);
      });
    });
    return allowed;
  }, [selectedOccasions, recipientGroupsByOccasion]);

  const selectedRecipientCount = selectedForWhom.filter((slug) => selectedRecipientUniverse.has(slug)).length;

  const toggleOccasion = (occasionSlug: string) => {
    const nextOccasions = selectedOccasions.includes(occasionSlug)
      ? selectedOccasions.filter((slug) => slug !== occasionSlug)
      : [...selectedOccasions, occasionSlug];

    const allowed = new Set<string>();
    nextOccasions.forEach((slug) => {
      (recipientGroupsByOccasion.get(slug) || []).forEach((recipient) => allowed.add(recipient.slug));
    });

    setSelectedOccasions(nextOccasions);
    setSelectedForWhom((prev) => prev.filter((slug) => allowed.has(slug)));
  };

  const toggleRecipient = (slug: string) => {
    setSelectedForWhom((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  };

  const toggleAllOccasions = () => {
    if (selectedOccasions.length === occasions.length) {
      setSelectedOccasions([]);
      setSelectedForWhom([]);
      return;
    }

    const allOccasionSlugs = occasions.map((occasion) => occasion.slug);
    const allRecipients = new Set<string>();
    allOccasionSlugs.forEach((slug) => {
      (recipientGroupsByOccasion.get(slug) || []).forEach((recipient) => allRecipients.add(recipient.slug));
    });

    setSelectedOccasions(allOccasionSlugs);
    setSelectedForWhom(Array.from(allRecipients));
  };

  const toggleAllForOccasion = (occasionSlug: string) => {
    const recipientsForOccasion = recipientGroupsByOccasion.get(occasionSlug) || [];
    const recipientSlugs = recipientsForOccasion.map((recipient) => recipient.slug);
    const allSelected = recipientSlugs.length > 0 && recipientSlugs.every((slug) => selectedForWhom.includes(slug));

    setSelectedForWhom((prev) => {
      if (allSelected) {
        return prev.filter((slug) => !recipientSlugs.includes(slug));
      }
      const next = new Set(prev);
      recipientSlugs.forEach((slug) => next.add(slug));
      return Array.from(next);
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-foreground font-serif">Product Images</h2>
        <MultiImagePicker
          value={images}
          onChange={setImages}
          folder="products"
          label="Upload 3-5 images (front, top, sliced, side views)"
          max={5}
        />
        <input type="hidden" name="images" value={JSON.stringify(images)} />
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="font-semibold text-foreground font-serif">Tags & Categorization</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pick one or more occasions, then choose recipient subtags inside each selected occasion.
          </p>
        </div>

        <div className="border-t border-border px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Occasions</span>
              {selectedOccasions.length > 0 && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                  {selectedOccasions.length} selected
                </span>
              )}
            </div>
            <button type="button" onClick={toggleAllOccasions} className="text-[11px] text-primary font-medium hover:underline">
              {selectedOccasions.length === occasions.length ? "Clear" : "Select All"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {occasions.map((occasion) => {
              const active = selectedOccasions.includes(occasion.slug);
              return (
                <button
                  key={occasion.slug}
                  type="button"
                  onClick={() => toggleOccasion(occasion.slug)}
                  className={`relative text-left rounded-xl border px-3 py-2.5 transition-all ${
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-white hover:border-primary/40"
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5 text-primary absolute top-2 right-2" />}
                  <div className="pr-5 text-xs font-semibold text-foreground">{occasion.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Who Is This For?</span>
            {selectedRecipientCount > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                {selectedRecipientCount} selected
              </span>
            )}
          </div>

          {selectedOccasions.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-3 py-4 text-xs text-muted-foreground">
              Select at least one occasion to unlock recipient subtags.
            </div>
          )}

          {selectedOccasions.length > 0 && (
            <div className="space-y-3">
              {selectedOccasions.map((occasionSlug) => {
                const occasion = occasions.find((item) => item.slug === occasionSlug);
                const recipientsForOccasion = recipientGroupsByOccasion.get(occasionSlug) || [];
                const selectedForThisOccasion = recipientsForOccasion.filter((recipient) =>
                  selectedForWhom.includes(recipient.slug)
                );

                return (
                  <div key={occasionSlug} className="rounded-2xl border border-border bg-gradient-to-br from-white to-muted/20 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{occasion?.name || occasionSlug}</div>
                        <div className="text-[11px] text-muted-foreground">{selectedForThisOccasion.length} selected</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAllForOccasion(occasionSlug)}
                        className="text-[11px] text-primary font-medium hover:underline"
                      >
                        {recipientsForOccasion.length > 0 && recipientsForOccasion.every((recipient) => selectedForWhom.includes(recipient.slug))
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>

                    {recipientsForOccasion.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">No recipient tags configured for this occasion yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {recipientsForOccasion.map((recipient) => {
                          const active = selectedForWhom.includes(recipient.slug);
                          return (
                            <button
                              key={`${occasionSlug}-${recipient.slug}`}
                              type="button"
                              onClick={() => toggleRecipient(recipient.slug)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                active
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-white text-foreground border-border hover:border-primary/40"
                              }`}
                            >
                              {recipient.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <input type="hidden" name="occasions" value={JSON.stringify(selectedOccasions)} />
        <input type="hidden" name="forWhom" value={JSON.stringify(selectedForWhom)} />
      </div>
    </>
  );
}
