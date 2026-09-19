"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/shared/toast";
import { AccountShell } from "@/components/v5/account-shell";
import { SiteFooter } from "@/components/v5/site-footer";
import { IconPin, IconPlus, IconTrash } from "@/components/v5/icons";

type Address = {
  id: string; label: string | null; fullAddress: string;
  landmark: string | null; pincode: string; isDefault?: boolean;
};

const BLANK = { label: "Home", line1: "", line2: "", landmark: "" };

export default function AddressesPage() {
  const { user, loading, setShowLoginModal } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState<Address[] | null>(null);
  const [form, setForm] = useState(BLANK);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) setShowLoginModal(true); }, [loading, user, setShowLoginModal]);

  const load = () =>
    fetch("/api/addresses").then((r) => r.json()).then((d) => setList(d?.addresses ?? [])).catch(() => setList([]));

  useEffect(() => { if (user) load(); }, [user]);

  const save = async () => {
    if (!form.line1.trim()) { toast("Enter a flat or house number", "error"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          fullAddress: [form.line1, form.line2].filter(Boolean).join(", "),
          landmark: form.landmark || null,
          pincode: "341508",
          city: "Kuchaman City",
          state: "Rajasthan",
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Could not save");
      toast("Address saved");
      setForm(BLANK);
      setAdding(false);
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
          {!adding && user ? (
            <button type="button" className="btn btn--rose btn--sm" onClick={() => setAdding(true)}>
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
            {adding && (
              <div className="opt-block" style={{ marginTop: 0, marginBottom: 16 }}>
                <h4>New address</h4>
                <div className="co5__grid">
                  <input className="input" placeholder="Flat / house no." value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
                  <input className="input" placeholder="Street / area" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
                  <input className="input" placeholder="Landmark (optional)" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
                  <input className="input" value="Kuchaman City 341508" disabled />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {["Home", "Work", "Other"].map((l) => (
                    <button type="button" key={l} className="chip chip--sm" aria-pressed={form.label === l} onClick={() => setForm({ ...form, label: l })}>{l}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button type="button" className="btn btn--rose btn--sm" disabled={busy} onClick={save}>Save address</button>
                  <button type="button" className="btn btn--out btn--sm" onClick={() => { setAdding(false); setForm(BLANK); }}>Cancel</button>
                </div>
              </div>
            )}

            {list === null ? (
              <div className="sk" style={{ height: 140, borderRadius: 16 }} />
            ) : list.length === 0 && !adding ? (
              <div className="v5empty">
                <IconPin />
                <h3 className="t-h3">No saved addresses</h3>
                <p className="t-small">Add one now and checkout gets a lot faster.</p>
                <button type="button" className="btn btn--rose btn--sm" onClick={() => setAdding(true)}>Add an address</button>
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
                    <span className="t-small">{[a.landmark, a.pincode].filter(Boolean).join(" · ")}</span>
                    <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
                      <button type="button" className="btn btn--ghost btn--sm addr5card__del" disabled={busy} onClick={() => remove(a.id)}>
                        <IconTrash /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="t-small" style={{ marginTop: 16 }}>
              We deliver within 12 km of Main Market, Kuchaman City — pincode 341508 and nearby.
            </p>
          </>
        )}
      </AccountShell>
      <SiteFooter />
    </>
  );
}
