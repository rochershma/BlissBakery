"use client";

import { useState } from "react";
import Image from "next/image";

interface Tag {
  slug: string;
  name: string;
  image?: string | null;
}

interface ProductTagSelectorProps {
  label: string;
  tags: Tag[];
  selectedSlugs: string[];
  onChange: (slugs: string[]) => void;
  fieldName: string;
}

export function ProductTagSelector({ label, tags, selectedSlugs, onChange, fieldName }: ProductTagSelectorProps) {
  const toggle = (slug: string) => {
    onChange(selectedSlugs.includes(slug) ? selectedSlugs.filter(s => s !== slug) : [...selectedSlugs, slug]);
  };

  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const selected = selectedSlugs.includes(tag.slug);
          return (
            <button
              key={tag.slug}
              type="button"
              onClick={() => toggle(tag.slug)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selected
                  ? "bg-primary/10 text-primary border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              {tag.image && (
                <div className="w-4 h-4 rounded-full overflow-hidden relative flex-shrink-0">
                  <Image src={tag.image} alt={tag.name} fill className="object-cover" sizes="16px" />
                </div>
              )}
              {tag.name}
            </button>
          );
        })}
      </div>
      <input type="hidden" name={fieldName} value={JSON.stringify(selectedSlugs)} />
    </div>
  );
}
