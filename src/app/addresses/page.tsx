"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/shared/toast";
import { AccountShell } from "@/components/v5/account-shell";
import { SiteFooter } from "@/components/v5/site-footer";
import { AddressForm, type SavedAddress } from "@/components/v5/address-form";
import { IconPin, IconPlus, IconTrash, IconEdit } from "@/components/v5/icons";

export default function AddressesPage() {
  const { user, loading, setShowLoginModal } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState<SavedAddress[] | null>(null);
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [area, setArea] = useState({ city: "", pincodes: [] as string[] });

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
        setArea({ city: d?.city ?? "", pincodes });
      })
      .catch(() => {});
  }, []);

  const close = () => { setOpen(false); setEditing(null); };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete");
      toast("Address removed");
      if (editing?.id === id) close();
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
            <button type="button" className="btn btn--rose btn--sm" onClick={() => { setEditing(null); setOpen(true); }}>
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
                <h4>{editing ? "Edit address" : "New address"}</h4>
                <AddressForm
                  initial={editing}
                  fallbackCity={area.city}
                  fallbackPincodes={area.pincodes}
                  onCancel={close}
                  onSaved={async () => {
                    toast(editing ? "Address updated" : "Address saved");
                    close();
                    await load();
                  }}
                />
              </div>
            )}

            {list === null ? (
              <div className="sk" style={{ height: 140, borderRadius: 16 }} />
            ) : list.length === 0 && !open ? (
              <div className="v5empty">
                <IconPin />
                <h3 className="t-h3">No saved addresses</h3>
                <p className="t-small">Add one now and checkout gets a lot faster.</p>
                <button type="button" className="btn btn--rose btn--sm" onClick={() => setOpen(true)}>Add an address</button>
              </div>
            ) : (
              <div className="addr5__grid">
                {list.map((a, i) => (
                  <div className={`addr5card${i === 0 ? " is-default" : ""}`} key={a.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span className="addr5__tag">{a.label || "Address"}</span>
                      {i === 0 ? <span className="badge badge--save">Default</span> : null}
                    </div>
                    <b style={{ fontSize: 15, display: "block", lineHeight: 1.4 }}>
                      {[a.houseNo, a.fullAddress].filter(Boolean).join(", ")}
                    </b>
                    <span className="t-small">{[a.landmark, a.city, a.pincode].filter(Boolean).join(" · ")}</span>
                    <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
                      <button type="button" className="btn btn--out btn--sm" disabled={busy} onClick={() => { setEditing(a); setOpen(true); }}>
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
          </>
        )}
      </AccountShell>
      <SiteFooter />
    </>
  );
}
