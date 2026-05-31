"use client";

import { useState } from "react";
import { MultiImagePicker } from "@/components/admin/multi-image-picker";
import { ProductTagSelector } from "@/components/admin/product-tag-selector";

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

      {/* Occasion & Recipient Tags */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-semibold text-foreground font-serif">Tags & Categorization</h2>
        {occasions.length > 0 && (
          <ProductTagSelector
            label="Tag Occasions (which celebrations is this cake for?)"
            tags={occasions}
            selectedSlugs={selectedOccasions}
            onChange={setSelectedOccasions}
            fieldName="occasions"
          />
        )}
        {recipients.length > 0 && (
          <ProductTagSelector
            label="For Whom (who would you gift this to?)"
            tags={recipients}
            selectedSlugs={selectedForWhom}
            onChange={setSelectedForWhom}
            fieldName="forWhom"
          />
        )}
      </div>
    </>
  );
}
