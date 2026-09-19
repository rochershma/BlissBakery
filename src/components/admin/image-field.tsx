"use client";

import { useState } from "react";
import { ImagePicker } from "@/components/admin/image-picker";

export function ImageField({ name, defaultValue, label, folder = "categories", aspectRatio = "square" }: {
  name: string;
  defaultValue: string;
  label?: string;
  folder?: string;
  aspectRatio?: "square" | "banner" | "free";
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <ImagePicker
        value={value}
        onChange={setValue}
        folder={folder}
        label={label || "Image"}
        aspectRatio={aspectRatio}
      />
    </div>
  );
}
