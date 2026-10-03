// Recolours the brand mark (white + one pink) to a new brand colour, keeping
// anti-aliased edges. node scripts/recolor-logo.mjs ad747e
import sharp from "sharp";

const hex = (process.argv[2] || "ad747e").replace("#", "");
const target = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));

const FILES = [
  ["public/uploads/branding/logo.png", 512],
  ["public/icons/icon-192.png"],
  ["public/icons/icon-512.png"],
  ["public/icons/maskable-512.png"],
  ["public/apple-touch-icon.png"],
  ["src/app/icon.png"],
  ["src/app/apple-icon.png"],
];

for (const [file, resize] of FILES) {
  let img = sharp(file).ensureAlpha();
  if (resize) img = img.resize(resize, resize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  // The source pink is the most common clearly-coloured pixel.
  const counts = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r - g > 40) {
      const k = `${r >> 2},${g >> 2},${b >> 2}`;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top) { console.log(`${file}: no brand colour found, skipped`); continue; }
  const srcG = Number(top[0].split(",")[1]) * 4 + 2;

  for (let i = 0; i < data.length; i += 4) {
    const [r, g] = [data[i], data[i + 1]];
    if (r < g) continue; // not on the white-to-pink line
    const t = Math.min(1, Math.max(0, (255 - g) / (255 - srcG)));
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(255 + t * (target[c] - 255));
  }
  await sharp(data, { raw: info }).png({ compressionLevel: 9, palette: false }).toFile(file + ".tmp");
  console.log(`${file}: ${info.width}x${info.height} recoloured from g=${srcG}`);
}
