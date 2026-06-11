// Check quality of single-image theme products and re-upload low quality ones
const fs = require("fs");

const lines = fs.readFileSync("scripts/all_theme_imgs.txt", "utf-8").split("\n").filter(Boolean);
let single = 0, multi = 0, total = 0;
const singleUrls = [];

for (const line of lines) {
  try {
    const imgs = JSON.parse(line);
    total++;
    if (imgs.length === 1) { single++; singleUrls.push(imgs[0]); }
    else multi++;
  } catch {}
}

console.log("Total:", total, "Multi-image:", multi, "Single-image:", single);

(async () => {
  let low = 0, ok = 0;
  const lowList = [];
  for (const u of singleUrls) {
    try {
      const r = await fetch(u, { method: "HEAD" });
      const bytes = parseInt(r.headers.get("content-length") || "0");
      const kb = Math.round(bytes / 1024);
      if (kb < 30) { low++; lowList.push({ url: u, kb }); }
      else ok++;
    } catch { low++; }
  }
  console.log("\nSingle-image quality check:");
  console.log("  Low quality (<30KB):", low);
  console.log("  OK (>=30KB):", ok);
  if (lowList.length > 0) {
    console.log("\nLow quality images:");
    lowList.forEach(l => console.log("  " + l.kb + "KB - " + l.url.split("/").pop()));
  }
})();
