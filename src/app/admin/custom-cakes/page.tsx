import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActiveStore } from "@/lib/active-store";
import { requireAdmin, sanitizeMax } from "@/lib/server-utils";
import { parseJsonSafe, formatPrice } from "@/lib/utils";
import { Cake, Phone, MessageCircle, CalendarDays, ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUSES = [
  { k: "RECEIVED", label: "New", cls: "bg-yellow-100 text-yellow-800" },
  { k: "QUOTED", label: "Quoted", cls: "bg-blue-100 text-blue-800" },
  { k: "CONFIRMED", label: "Confirmed", cls: "bg-purple-100 text-purple-800" },
  { k: "COMPLETED", label: "Completed", cls: "bg-green-100 text-green-800" },
  { k: "DECLINED", label: "Declined", cls: "bg-gray-100 text-gray-700" },
];
const STATUS_KEYS = STATUSES.map((s) => s.k);

async function updateRequest(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const quoted = Number(formData.get("quotedPrice"));
  if (!id || !STATUS_KEYS.includes(status)) return;
  await db.customCakeOrder.update({
    where: { id },
    data: {
      status,
      quotedPrice: Number.isFinite(quoted) && quoted > 0 ? Math.round(quoted) : null,
      adminNotes: sanitizeMax(formData.get("adminNotes") as string, 1000),
    },
  });
  revalidatePath("/admin/custom-cakes");
}

export default async function CustomCakeRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const store = await requireActiveStore();
  const { status } = await searchParams;
  const filter = status && STATUS_KEYS.includes(status) ? status : undefined;

  // Requests made before outlets were recorded show everywhere so none are lost.
  const scope = { OR: [{ storeId: store.id }, { storeId: null }] };
  const [requests, counts] = await Promise.all([
    db.customCakeOrder.findMany({
      where: { ...scope, ...(filter ? { status: filter } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.customCakeOrder.groupBy({ by: ["status"], where: scope, _count: true }),
  ]);
  const count = (k: string) => counts.find((c) => c.status === k)?._count ?? 0;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground font-serif">Custom cake requests</h1>
        <p className="text-sm text-muted-foreground">Quote on WhatsApp, then track each request through to delivery.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
        <Link href="/admin/custom-cakes" className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${!filter ? "bg-primary text-white border-primary" : "bg-white border-border"}`}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link key={s.k} href={`/admin/custom-cakes?status=${s.k}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${filter === s.k ? "bg-primary text-white border-primary" : "bg-white border-border"}`}>
            {s.label} · {count(s.k)}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center text-muted-foreground">
          <Cake className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No requests here yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const st = STATUSES.find((s) => s.k === r.status) ?? STATUSES[0];
            const photos = parseJsonSafe<string[]>(r.referenceImages, []);
            const text = encodeURIComponent(
              `Hi ${r.customerName}, thanks for your custom cake request ${r.orderNumber} (${r.cakeSize}, ${r.baseFlavour}${r.theme ? `, ${r.theme}` : ""}).`,
            );
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-sm">{r.customerName}</span>
                  <span className="text-xs text-muted-foreground">{r.orderNumber}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="p-4 grid md:grid-cols-[1fr_300px] gap-4">
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Cake:</span> <b>{r.cakeSize}</b> · {r.baseFlavour}{r.frosting ? ` · ${r.frosting}` : ""}</p>
                    {r.theme ? <p><span className="text-muted-foreground">Theme:</span> {r.theme}</p> : null}
                    {r.messageOnCake ? <p><span className="text-muted-foreground">Message:</span> &ldquo;{r.messageOnCake}&rdquo;</p> : null}
                    {r.designDescription ? <p className="text-muted-foreground whitespace-pre-line">{r.designDescription}</p> : null}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {r.preferredDate ? (
                        <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />
                          {new Date(r.preferredDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                        </span>
                      ) : null}
                      {r.budgetRange ? <span>Budget {r.budgetRange}</span> : null}
                      {r.quotedPrice ? <span>Quoted {formatPrice(r.quotedPrice)}</span> : null}
                    </div>
                    {photos.length ? (
                      <div className="flex gap-2 flex-wrap pt-1">
                        {photos.map((p, i) => (
                          <a key={p} href={p} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted block" title={`Reference ${i + 1}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> No photos attached</p>
                    )}
                    <div className="flex gap-3 pt-1">
                      <a href={`tel:+91${r.customerPhone}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                        <Phone className="w-3.5 h-3.5" /> +91 {r.customerPhone}
                      </a>
                      <a href={`https://wa.me/91${r.customerPhone}?text=${text}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline">
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </div>
                  </div>
                  <form action={updateRequest} className="space-y-2 bg-muted/30 rounded-xl p-3">
                    <input type="hidden" name="id" value={r.id} />
                    <label className="block text-xs font-medium">Status
                      <select name="status" defaultValue={r.status} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-white text-sm">
                        {STATUSES.map((s) => <option key={s.k} value={s.k}>{s.label}</option>)}
                      </select>
                    </label>
                    <label className="block text-xs font-medium">Quoted price (₹)
                      <input name="quotedPrice" type="number" min={0} step={1} defaultValue={r.quotedPrice ?? ""} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-white text-sm" />
                    </label>
                    <label className="block text-xs font-medium">Notes
                      <textarea name="adminNotes" rows={2} defaultValue={r.adminNotes ?? ""} className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-white text-sm" />
                    </label>
                    <button className="w-full py-2 rounded-lg bg-primary text-white text-sm font-semibold">Save</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
