// Test scraping — find product images in Bakingo's SSR data
const url = "https://www.bakingo.com/p/theme-cake/amazing-spiderman-cake-theme3982flav";

(async () => {
  console.log("Fetching:", url);
  const resp = await fetch(url, { 
    headers: { 
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    } 
  });
  const html = await resp.text();
  
  // Look for JSON data in script tags (Next.js __NEXT_DATA__ or similar)
  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/i);
  if (nextDataMatch) {
    const data = JSON.parse(nextDataMatch[1]);
    console.log("Found __NEXT_DATA__");
    // Search for image URLs in the data
    const jsonStr = JSON.stringify(data);
    const mediaUrls = [...jsonStr.matchAll(/"(https?:\/\/media\.bakingo\.com\/[^"]+)"/g)].map(m => m[1]);
    console.log("Media URLs found:", mediaUrls.length);
    mediaUrls.slice(0, 10).forEach((u, i) => console.log(`  ${i+1}. ${u}`));
    return;
  }
  
  // Try finding image URLs in any script/JSON embedded data
  const allMediaUrls = [...html.matchAll(/https?:\/\/media\.bakingo\.com\/[^"'\s)]+/g)].map(m => m[0]);
  const unique = [...new Set(allMediaUrls)];
  console.log("All media.bakingo URLs found:", unique.length);
  unique.forEach((u, i) => console.log(`  ${i+1}. ${u}`));
  
  // Also check for bkmedia
  const bkMediaUrls = [...html.matchAll(/https?:\/\/bkmedia\.bakingo\.com\/[^"'\s)]+/g)].map(m => m[0]);
  const uniqueBk = [...new Set(bkMediaUrls)];
  console.log("\nbkmedia URLs:", uniqueBk.length);
  uniqueBk.slice(0, 10).forEach((u, i) => console.log(`  ${i+1}. ${u}`));
  
  // Check for any image patterns
  const allImgSrc = [...html.matchAll(/(?:src|data-src|content)="([^"]*(?:bakingo|theme|cake)[^"]*)"/gi)];
  console.log("\nAll bakingo/theme/cake img refs:", allImgSrc.length);
  allImgSrc.slice(0, 10).forEach((m, i) => console.log(`  ${i+1}. ${m[1].slice(0, 100)}`));
})();
