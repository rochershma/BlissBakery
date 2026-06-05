"use client";

import { useMemo, useState } from "react";
import { MultiImagePicker } from "@/components/admin/multi-image-picker";
import { Check, Tag, Users, X } from "lucide-react";

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

interface ThemeTag {
  slug: string;
  name: string;
}

interface Props {
  defaultImages: string[];
  defaultOccasions: string[];
  defaultForWhom: string[];
  defaultThemes?: string[];
  occasions: OccasionTag[];
  recipientGroups: RecipientGroup[];
  themes?: ThemeTag[];
}

/**
 * Tracks per-occasion recipient selections using compound keys "occasionSlug::recipientSlug"
 * so that selecting "For Wife" in Anniversary does NOT select "For Wife" in Birthday.
 * On save, flattens to unique recipient slugs for the hidden form field.
 */

function buildCompoundKeys(
  activeOccasions: string[],
  recipientSlugs: string[],
  groupsByOccasion: Map<string, RecipientTag[]>
): Set<string> {
  const keys = new Set<string>();
  activeOccasions.forEach((occasionSlug) => {
    const recipients = groupsByOccasion.get(occasionSlug) || [];
    recipients.forEach((r) => {
      if (recipientSlugs.includes(r.slug)) {
        keys.add(`${occasionSlug}::${r.slug}`);
      }
    });
  });
  return keys;
}

function flattenToSlugs(compoundKeys: Set<string>): string[] {
  const slugs = new Set<string>();
  compoundKeys.forEach((key) => {
    const slug = key.split("::")[1];
    if (slug) slugs.add(slug);
  });
  return Array.from(slugs);
}

export function ProductFormFields({
  defaultImages,
  defaultOccasions,
  defaultForWhom,
  defaultThemes = [],
  occasions,
  recipientGroups,
  themes = [],
}: Props) {
  const [images, setImages] = useState<string[]>(defaultImages);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(defaultOccasions);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(defaultThemes);
  const [modalOccasion, setModalOccasion] = useState<string | null>(null);

  const groupsByOccasion = useMemo(
    () => new Map(recipientGroups.map((g) => [g.occasionSlug, g.recipients])),
    [recipientGroups]
  );

  const [compoundSelections, setCompoundSelections] = useState<Set<string>>(
    () => buildCompoundKeys(defaultOccasions, defaultForWhom, groupsByOccasion)
  );

  const forWhomFlat = useMemo(() => flattenToSlugs(compoundSelections), [compoundSelections]);

  const countForOccasion = (occasionSlug: string): number => {
    let count = 0;
    compoundSelections.forEach((key) => {
      if (key.startsWith(`${occasionSlug}::`)) count++;
    });
    return count;
  };

  const toggleOccasion = (occasionSlug: string) => {
    if (selectedOccasions.includes(occasionSlug)) {
      setSelectedOccasions((prev) => prev.filter((s) => s !== occasionSlug));
      setCompoundSelections((prev) => {
        const next = new Set(prev);
        prev.forEach((key) => {
          if (key.startsWith(`${occasionSlug}::`)) next.delete(key);
        });
        return next;
      });
    } else {
      setSelectedOccasions((prev) => [...prev, occasionSlug]);
      setModalOccasion(occasionSlug);
    }
  };

  const toggleCompound = (occasionSlug: string, recipientSlug: string) => {
    const key = `${occasionSlug}::${recipientSlug}`;
    setCompoundSelections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleAllForOccasion = (occasionSlug: string) => {
    const recipients = groupsByOccasion.get(occasionSlug) || [];
    const keys = recipients.map((r) => `${occasionSlug}::${r.slug}`);
    const allSelected = keys.length > 0 && keys.every((k) => compoundSelections.has(k));
    setCompoundSelections((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => allSelected ? next.delete(k) : next.add(k));
      return next;
    });
  };

  const toggleAllOccasions = () => {
    if (selectedOccasions.length === occasions.length) {
      setSelectedOccasions([]);
      setCompoundSelections(new Set());
    } else {
      setSelectedOccasions(occasions.map((o) => o.slug));
    }
  };

  const modalData = modalOccasion ? occasions.find((o) => o.slug === modalOccasion) : null;
  const modalRecipients = modalOccasion ? (groupsByOccasion.get(modalOccasion) || []) : [];

  return (
    <>
      {/* Product Images */}
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

      {/* Tags & Categorization */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="font-semibold text-foreground font-serif">Tags & Categorization</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click an occasion to select it and pick recipients. Each occasion has its own independent recipients.
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
              {compoundSelections.size > 0 && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                  <Users className="w-3 h-3 inline -mt-0.5 mr-0.5" />{compoundSelections.size} recipients
                </span>
              )}
            </div>
            <button type="button" onClick={toggleAllOccasions} className="text-[11px] text-primary font-medium hover:underline">
              {selectedOccasions.length === occasions.length ? "Clear All" : "Select All"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {occasions.map((occasion) => {
              const active = selectedOccasions.includes(occasion.slug);
              const rCount = countForOccasion(occasion.slug);
              return (
                <button
                  key={occasion.slug}
                  type="button"
                  onClick={() => active ? setModalOccasion(occasion.slug) : toggleOccasion(occasion.slug)}
                  className={`relative text-left rounded-xl border px-3 py-2.5 transition-all ${
                    active
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-white hover:border-primary/40"
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5 text-primary absolute top-2 right-2" />}
                  <div className="pr-5 text-xs font-semibold text-foreground">{occasion.name}</div>
                  {active && rCount > 0 && (
                    <div className="text-[10px] text-primary mt-0.5">{rCount} recipient{rCount > 1 ? "s" : ""}</div>
                  )}
                  {active && rCount === 0 && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">Tap to pick recipients</div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedOccasions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedOccasions.map((slug) => {
                const occasion = occasions.find((o) => o.slug === slug);
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => toggleOccasion(slug)}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-[10px] font-medium hover:bg-primary/20"
                  >
                    {occasion?.name} <X className="w-3 h-3" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <input type="hidden" name="occasions" value={JSON.stringify(selectedOccasions)} />
        <input type="hidden" name="forWhom" value={JSON.stringify(forWhomFlat)} />
      </div>

      {/* Theme Tags */}
      {themes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Cake Themes</h3>
            {selectedThemes.length > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {selectedThemes.length} selected
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => {
              const active = selectedThemes.includes(theme.slug);
              return (
                <button
                  key={theme.slug}
                  type="button"
                  onClick={() => active
                    ? setSelectedThemes(prev => prev.filter(s => s !== theme.slug))
                    : setSelectedThemes(prev => [...prev, theme.slug])
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {active && <Check className="w-3 h-3 inline mr-1" />}
                  {theme.name}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="themes" value={JSON.stringify(selectedThemes)} />
        </div>
      )}

      {/* Recipient Selection Modal */}
      {modalOccasion && modalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={() => setModalOccasion(null)}>
          <div className="bg-white rounded-2xl p-5 max-w-md w-[calc(100%-2rem)] shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">{modalData.name}</h3>
                <p className="text-xs text-muted-foreground">Select who this product is for</p>
              </div>
              <button type="button" onClick={() => setModalOccasion(null)} className="p-1 rounded-full hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalRecipients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No recipient tags configured for this occasion yet.</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">
                    {countForOccasion(modalOccasion)} of {modalRecipients.length} selected
                  </span>
                  <button type="button" onClick={() => toggleAllForOccasion(modalOccasion)} className="text-xs text-primary font-medium hover:underline">
                    {modalRecipients.every((r) => compoundSelections.has(`${modalOccasion}::${r.slug}`)) ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="space-y-2">
                  {modalRecipients.map((recipient) => {
                    const key = `${modalOccasion}::${recipient.slug}`;
                    const checked = compoundSelections.has(key);
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          checked ? "bg-primary/5 border-primary" : "bg-white border-border hover:border-primary/30"
                        }`}
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleCompound(modalOccasion, recipient.slug)} className="w-4 h-4 accent-primary" />
                        <span className="text-sm font-medium text-foreground">{recipient.name}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            <button type="button" onClick={() => setModalOccasion(null)} className="w-full mt-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-hover transition-colors">
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
