// Cloudinary image loader — serves pre-optimized images from CDN
// instead of downloading full-res and resizing on our server.
// Only used for Cloudinary URLs; local images use default Next.js loader.

export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // Only transform Cloudinary URLs
  if (!src.includes("res.cloudinary.com")) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
  }

  // Insert Cloudinary transformations before the version/path
  // URL format: https://res.cloudinary.com/CLOUD/image/upload/vXXX/path.jpg
  // Becomes:    https://res.cloudinary.com/CLOUD/image/upload/w_WIDTH,q_QUALITY,f_auto/vXXX/path.jpg
  const q = quality || 75;
  const transforms = `w_${width},q_${q},f_auto,c_limit`;

  return src.replace("/image/upload/", `/image/upload/${transforms}/`);
}
