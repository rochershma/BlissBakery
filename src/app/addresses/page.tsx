"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/shared/toast";
import { AccountShell } from "@/components/v5/account-shell";
import { SiteFooter } from "@/components/v5/site-footer";
import { IconPin, IconPlus, IconTrash, IconEdit } from "@/components/v5/icons";

type Address = {
  id: string; label: string | null; fullAddress: string;
  landmark: string | null; pincode: string; city: string | null; state: string | null;
};

type Area = { city: string; pincodes: string[]; state: string };

const BLANK = { label: "Home", line1: "", line2: "", landmark: "", pincode: "" };

export default function AddressesPage() {
  const { user, loading, setShowLoginModal } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState<Address[] | null>(null);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [area, setArea] = useState<Area>({ city: "", pincodes: [], state: "Rajasthan" });

  useEffect(() => { if (!loading && !user) setShowLoginModal(true); }, [loading, user, setShowLoginModal]);

  const load = useCallback(
    () => fetch("/api/addresses").then((r) => r.json()).then((d) => setList(d?.addresses ?? [])).catch(() => setList([])),
    [],
  );

  useEffect(() => { if (user) load(); }, [user, load]);

  // The serviceable area belongs to the outlet, not to this page.
  useEffect(() => {
    fetch("/api/store/config")
      .then((r) => r.json())
      .then((d) => {
        const pincodes: string[] = Array.isArray(d?.servicePincodes) && d.servicePincodes.length
          ? d.servicePincodes
          : [d?.pincode].filter(Boolean);
        setArea({ city: d?.city ?? "", pincodes, state: "Rajasthan" });
        setForm((f) => ({ ...f, pincode: f.pincode || pincodes[0] || "" }));
      })
      .catch(() => {});
  }, []);

  const startAdd = () => {
    setEditingId(null);
    setForm({ ...BLANK, pincode: area.pincodes[0] ?? "" });
    setOpen(true);
  };

  const startEdit = (a: Address) => {
    const [line1 = "", ...rest] = a.fullAddress.split(",").map((s) => s.trim());
    setEditingId(a.id);
    setForm({
      label: a.label || "Home",
      line1,
      line2: rest.join(", "),
      landmark: a.landmark || "",
      pincode: a.pincode,
    });
    setOpen(true);
  };

  const close = () => { setOpen(false); setEditingId(null); setForm(BLANK); };

  const save = async () => {
    if (!form.line1.trim()) { toast("Enter a flat or house number", "error"); return; }
    if (!form.pincode.trim()) { toast("Choose a delivery pincode", "error"); return; }
    setBusy(true);
    try {
      const res = await fetch(editingId ? `/api/addresses?id=${editingId}` : "/api/addresses", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          fullAddress: [form.line1, form.line2].filter(Boolean).join(", "),
          landmark: form.landmark || null,
          pincode: form.pincode,
          city: area.city,
          state: area.state,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not save");
      toast(editingId ? "Address updated" : "Address saved");
      close();
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete");
      toast("Address removed");
      if (editingId === id) close();
      await load();
    } catch {
      toast("Could not delete", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AccountShell active="/addresses">
        <div className="acct5__hd">
          <h1 className="t-h1">Saved addresses</h1>
          {!open && user ? (
            <button type="button" className="btn btn--rose btn--sm" onClick={startAdd}>
              <IconPlus /> Add address
            </button>
          ) : null}
        </div>

        {!user ? (
          <div className="v5empty">
            <IconPin />
            <h3 className="t-h3">Sign in to manage addresses</h3>
            <button type="button" className="btn btn--rose btn--sm" onClick={() => setShowLoginModal(true)}>Sign in</button>
          </div>
        ) : (
          <>
            {open && (
              <div className="opt-block" style={{ marginTop: 0, marginBottom: 16 }}>
                <h4>{editingId ? "Edit address" : "New address"}</h4>
                <div className="co5__grid">
                  <input className="input" placeholder="Flat / house no." value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
                  <input className="input" placeholder="Street / area" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
                  <input className="input" placeholder="Landmark (optional)" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
                  {area.pincodes.length > 1 ? (
                    <select className="select" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} aria-label="Delivery pincode">
                      {area.pincodes.map((p) => <option key={p} value={p}>{area.city} {p}</option>)}
                    </select>
                  ) : (
                    <input className="input" value={`${area.city} ${form.pincode}`.trim()} disabled />
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {["Home", "Work", "Other"].map((l) => (
                    <button type="button" key={l} className="chip chip--sm" aria-pressed={form.label === l} onClick={() => setForm({ ...form, label: l })}>{l}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button type="button" className="btn btn--rose btn--sm" disabled={busy} onClick={save}>
                    {busy ? "Saving…" : editingId ? "Update address" : "Save address"}
                  </button>
                  <button type="button" className="btn btn--out btn--sm" onClick={close}>Cancel</button>
                </div>
              </div>
            )}

            {list === null ? (
              <div className="sk" style={{ height: 140, borderRadius: 16 }} />
            ) : list.length === 0 && !open ? (
              <div className="v5empty">
                <IconPin />
                <h3 className="t-h3">No saved addresses</h3>
                <p className="t-small">Add one now and checkout gets a lot faster.</p>
                <button type="button" className="btn btn--rose btn--sm" onClick={startAdd}>Add an address</button>
              </div>
            ) : (
              <div className="addr5__grid">
                {list.map((a, i) => (
                  <div className={`addr5card${i === 0 ? " is-default" : ""}`} key={a.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span className="addr5__tag">{a.label || "Address"}</span>
                      {i === 0 ? <span className="badge badge--save">Default</span> : null}
                    </div>
                    <b style={{ fontSize: 15, display: "block", lineHeight: 1.4 }}>{a.fullAddress}</b>
                    <span className="t-small">{[a.landmark, a.city, a.pincode].filter(Boolean).join(" · ")}</span>
                    <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
                      <button type="button" className="btn btn--out btn--sm" disabled={busy} onClick={() => startEdit(a)}>
                        <IconEdit /> Edit
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm addr5card__del" disabled={busy} onClick={() => remove(a.id)}>
                        <IconTrash /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {area.pincodes.length > 0 ? (
              <p className="t-small" style={{ marginTop: 16 }}>
                {area.city} delivery is available for pincode{area.pincodes.length > 1 ? "s" : ""} {area.pincodes.join(", ")}.
              </p>
            ) : null}
          </>
        )}
      </AccountShell>
      <SiteFooter />
    </>
  );
}
