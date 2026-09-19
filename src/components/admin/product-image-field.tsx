"use client";

import { useState } from "react";
import { ImagePicker } from "@/components/admin/image-picker";

export function ProductImageField({ defaultValue }: { defaultValue: string }) {
  const [imageUrl, setImageUrl] = useState(defaultValue);

  return (
    <div>
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <ImagePicker
        value={imageUrl}
        onChange={setImageUrl}
        folder="products"
        label="Product Image"
        aspectRatio="square"
      />
    </div>
  );
}
