"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/shared/toast";
import { AccountShell } from "@/components/v5/account-shell";
import { SiteFooter } from "@/components/v5/site-footer";
import { IconUser } from "@/components/v5/icons";

export default function ProfilePage() {
  const { user, loading, setShowLoginModal, updateProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) setShowLoginModal(true); }, [loading, user, setShowLoginModal]);
  useEffect(() => {
    if (user) { setName(user.name ?? ""); setEmail(user.email ?? ""); }
  }, [user]);

  const emailLocked = Boolean(user?.email);

  const save = async () => {
    if (name.trim().length < 2) { toast("Enter your full name", "error"); return; }
    setBusy(true);
    try {
      const { success, message } = await updateProfile(
        name.trim(),
        emailLocked ? undefined : email.trim() || undefined,
      );
      if (!success) throw new Error(message ?? "Could not save");
      toast("Profile updated");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AccountShell active="/profile">
        <h1 className="t-h1" style={{ marginBottom: 18 }}>Profile</h1>

        {!user ? (
          <div className="v5empty">
            <IconUser />
            <h3 className="t-h3">Sign in to view your profile</h3>
            <button type="button" className="btn btn--rose btn--sm" onClick={() => setShowLoginModal(true)}>Sign in</button>
          </div>
        ) : (
          <div className="opt-block" style={{ marginTop: 0, maxWidth: 560 }}>
            <div className="co5__grid">
              <label className="field">
                <span className="t-micro">Full name</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </label>
              <label className="field">
                <span className="t-micro">Mobile · cannot be changed</span>
                <input className="input" value={`+91 ${user.phone}`} disabled />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <span className="t-micro">
                  {emailLocked ? "Email · cannot be changed" : "Email · for invoices"}
                </span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={emailLocked}
                />
                {emailLocked ? (
                  <span className="t-small">Contact us if you need this changed.</span>
                ) : null}
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="button" className="btn btn--rose" disabled={busy} onClick={save}>
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </AccountShell>
      <SiteFooter />
    </>
  );
}
