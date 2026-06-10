// Test scraping a single Bakingo product
const url = "https://www.bakingo.com/p/theme-cake/amazing-spiderman-cake-theme3982flav";

(async () => {
  console.log("Fetching:", url);
  const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
  if (!resp.ok) { console.log("FAILED:", resp.status); return; }
  const html = await resp.text();
  console.log("HTML length:", html.length);

  // Extract name
  const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || html.match(/<title>([^|<]+)/i);
  const name = nameMatch?.[1]?.trim()?.replace(/\s*\|.*$/, "").replace(/Online\s*$/i, "").replace(/\s*-\s*Bakingo.*$/i, "").trim() || "Unknown";

  // Extract description  
  const descMatch = html.match(/name="description"\s+content="([^"]+)"/i);
  const desc = descMatch?.[1]?.trim() || "";

  // Extract OG image
  const ogImg = html.match(/property="og:image"\s+content="([^"]+)"/i);

  // Extract product images
  const allImgs = [...html.matchAll(/(?:data-src|src)="(https:\/\/media\.bakingo\.com\/[^"]+\.(?:jpg|png|webp))/gi)];
  const unique = new Set();
  if (ogImg?.[1]) unique.add(ogImg[1].replace(/\?.*$/, ""));
  for (const m of allImgs) {
    const u = m[1].replace(/\?.*$/, "");
    if (!u.includes("thumb") && !u.includes("100x") && !u.includes("icon") && !u.includes("logo")) {
      unique.add(u);
    }
  }
  const images = [...unique].slice(0, 4);

  console.log("Name:", name);
  console.log("Desc:", desc.slice(0, 150));
  console.log("Images:", images.length);
  images.forEach((u, i) => console.log(`  ${i+1}.`, u));
})();
