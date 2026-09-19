"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

const FALLBACK_SRC = "/images/hero/AMMO6974.jpg";

export function SafeImage({ src, alt, onError, ...props }: ImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        setImgSrc(FALLBACK_SRC);
      }}
    />
  );
}
