"use client";

import { useState } from "react";
import { MultiImagePicker } from "@/components/admin/multi-image-picker";
import { ProductTagSelector } from "@/components/admin/product-tag-selector";
import { ChevronDown, ChevronUp, Tag, Users } from "lucide-react";

interface OccasionTag { slug: string; name: string; image?: string | null; }
interface RecipientTag { slug: string; name: string; image?: string | null; }

interface Props {
  defaultImages: string[];
  defaultOccasions: string[];
  defaultForWhom: string[];
  occasions: OccasionTag[];
  recipients: RecipientTag[];
}

// Mapping of occasions to relevant recipients
const OCCASION_RECIPIENT_MAP: Record<string, string[]> = {
  "birthday": ["for-wife", "for-husband", "for-kids", "for-friend", "for-dad", "for-mom", "for-parents"],
  "anniversary": ["for-wife", "for-husband", "for-parents"],
  "wedding": ["for-friend", "for-colleague"],
  "festival": ["for-family", "for-friend"],
  "kids-cake": ["for-kids"],
  "designer-cakes": ["for-wife", "for-husband", "for-friend", "for-colleague", "for-parents"],
  "engagement": ["for-friend"],
};

export function ProductFormFields({ defaultImages, defaultOccasions, defaultForWhom, occasions, recipients }: Props) {
  const [images, setImages] = useState<string[]>(defaultImages);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(defaultOccasions);
  const [selectedForWhom, setSelectedForWhom] = useState<string[]>(defaultForWhom);
  const [showOccasions, setShowOccasions] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);

  // Get relevant recipients based on selected occasions
  const relevantRecipientSlugs = new Set<string>();
  selectedOccasions.forEach(occasionSlug => {
    const mapped = OCCASION_RECIPIENT_MAP[occasionSlug] || [];
    mapped.forEach(slug => relevantRecipientSlugs.add(slug));
  });

  // If no occasions selected, show all recipients; otherwise filter
  const visibleRecipients = selectedOccasions.length === 0 
    ? recipients 
    : recipients.filter(r => relevantRecipientSlugs.has(r.slug));

  return (
    <>
      {/* Multi-Image Upload */}
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

      {/* Occasion & Recipient Tags — accordion style */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="font-semibold text-foreground font-serif">Tags & Categorization</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Select occasions first, then recipient tags will filter to show relevant options</p>
        </div>

        {/* Occasions accordion */}
        {occasions.length > 0 && (
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => setShowOccasions(!showOccasions)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Occasions</span>
                {selectedOccasions.length > 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                    {selectedOccasions.length} selected
                  </span>
                )}
              </div>
              {showOccasions ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showOccasions && (
              <div className="px-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground">Which celebrations is this for?</span>
                  <button
                    type="button"
                    onClick={() => setSelectedOccasions(selectedOccasions.length === occasions.length ? [] : occasions.map(o => o.slug))}
                    className="text-[10px] text-primary font-medium hover:underline"
                  >
                    {selectedOccasions.length === occasions.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <ProductTagSelector
                  label=""
                  tags={occasions}
                  selectedSlugs={selectedOccasions}
                  onChange={setSelectedOccasions}
                  fieldName="occasions"
                />
              </div>
            )}
          </div>
        )}

        {/* Recipients accordion - contextual based on selected occasions */}
        {selectedOccasions.length > 0 && visibleRecipients.length > 0 && (
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => setShowRecipients(!showRecipients)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Who is this for?</span>
                {selectedForWhom.length > 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                    {selectedForWhom.length} selected
                  </span>
                )}
              </div>
              {showRecipients ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showRecipients && (
              <div className="px-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground">Recipients relevant to selected occasions:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedForWhom(selectedForWhom.length === visibleRecipients.length ? [] : visibleRecipients.map(r => r.slug))}
                    className="text-[10px] text-primary font-medium hover:underline"
                  >
                    {selectedForWhom.length === visibleRecipients.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <ProductTagSelector
                  label=""
                  tags={visibleRecipients}
                  selectedSlugs={selectedForWhom}
                  onChange={setSelectedForWhom}
                  fieldName="forWhom"
                />
              </div>
            )}
          </div>
        )}

        {selectedOccasions.length === 0 && (
          <div className="px-5 py-4 text-xs text-muted-foreground italic">
            Select occasions above to see relevant recipient options
          </div>
        )}
      </div>
    </>
  );
}
