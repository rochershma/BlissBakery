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

export function ProductFormFields({ defaultImages, defaultOccasions, defaultForWhom, occasions, recipients }: Props) {
  const [images, setImages] = useState<string[]>(defaultImages);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(defaultOccasions);
  const [selectedForWhom, setSelectedForWhom] = useState<string[]>(defaultForWhom);
  const [showOccasions, setShowOccasions] = useState(defaultOccasions.length > 0);
  const [showRecipients, setShowRecipients] = useState(defaultForWhom.length > 0);

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
          <p className="text-xs text-muted-foreground mt-0.5">Select occasions and recipients to help customers find this product</p>
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

        {/* Recipients accordion */}
        {recipients.length > 0 && (
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => setShowRecipients(!showRecipients)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">For Whom</span>
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
                  <span className="text-[10px] text-muted-foreground">Who would you gift this to?</span>
                  <button
                    type="button"
                    onClick={() => setSelectedForWhom(selectedForWhom.length === recipients.length ? [] : recipients.map(r => r.slug))}
                    className="text-[10px] text-primary font-medium hover:underline"
                  >
                    {selectedForWhom.length === recipients.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <ProductTagSelector
                  label=""
                  tags={recipients}
                  selectedSlugs={selectedForWhom}
                  onChange={setSelectedForWhom}
                  fieldName="forWhom"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
