(async () => {
  for (const u of ["https://blissbakery.shop/", "http://blissbakery.shop/"]) {
    try {
      const r = await fetch(u, { redirect: "manual" });
      const b = await r.text();
      const cf = /Error (\d{3})/.exec(b) || /cloudflare/i.test(b) && ["", "page"] || [];
      console.log(`${u} -> ${r.status} ${r.headers.get("server") || ""} ${cf[1] ? "CF-Error-" + cf[1] : ""}`);
      const title = /<title>([^<]{0,90})/i.exec(b);
      if (title) console.log("   title:", title[1].trim());
    } catch (e) {
      console.log(`${u} -> ERROR ${String(e.cause?.code || e.message).slice(0, 60)}`);
    }
  }
})();
