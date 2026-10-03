// Repairs text that was UTF-8, read as code page 437, and saved again —
// e.g. “Bride” stored as ΓÇ£BrideΓÇ¥, Gentleman’s as GentlemanΓÇÖs.
// Dry run by default:  node scripts/fix-mojibake.mjs
// Write changes:       node scripts/fix-mojibake.mjs --apply
import { PrismaClient } from "@prisma/client";

const CP437_HIGH =
  "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\u00a0";
if ([...CP437_HIGH].length !== 128) throw new Error("CP437 table must have 128 entries");
const toByte = new Map([...CP437_HIGH].map((ch, i) => [ch, 0x80 + i]));
const utf8 = new TextDecoder("utf-8", { fatal: true });

export function repair(s) {
  if (!s) return s;
  return s.replace(/[^\x00-\x7f]+/g, (run) => {
    const chars = [...run];
    if (!chars.every((c) => toByte.has(c))) return run;
    try {
      const out = utf8.decode(Uint8Array.from(chars.map((c) => toByte.get(c))));
      // Only accept a decode that actually shrank the run into real characters.
      return out.length < run.length ? out : run;
    } catch {
      return run; // genuine accented text such as "Café"
    }
  });
}

const FIELDS = {
  product: ["name", "shortDesc", "description", "ingredients", "servingInfo"],
  category: ["name", "description"],
  occasion: ["name", "description"],
  theme: ["name", "description"],
  themeTag: ["name"],
};

const apply = process.argv.includes("--apply");
const db = new PrismaClient();
let changed = 0;
for (const [model, fields] of Object.entries(FIELDS)) {
  const valid = fields.filter((f) => db[model]?.fields?.[f]);
  if (!valid.length) continue;
  const rows = await db[model].findMany({ select: Object.fromEntries([["id", true], ...valid.map((f) => [f, true])]) });
  let n = 0;
  for (const r of rows) {
    const data = {};
    for (const f of valid) {
      const fixed = repair(r[f]);
      if (fixed !== r[f]) data[f] = fixed;
    }
    if (!Object.keys(data).length) continue;
    n++;
    if (n <= 3) console.log(`  ${model} ${r.id}:`, Object.entries(data).map(([k, v]) => `${k}=${JSON.stringify(String(v).slice(0, 70))}`).join(" "));
    if (apply) await db[model].update({ where: { id: r.id }, data });
  }
  console.log(`${model}: ${n} row(s) ${apply ? "repaired" : "would be repaired"}`);
  changed += n;
}
console.log(apply ? `done — ${changed} rows` : `dry run — ${changed} rows; re-run with --apply`);
await db.$disconnect();
