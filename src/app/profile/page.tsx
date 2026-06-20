"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { SiteHeader } from "@/components/shared/site-header";
import { useState, useEffect } from "react";
import { Phone, Mail, User as UserIcon, Save, Package, MapPin, Heart, Shield, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading, setShowLoginModal, updateProfile, logout } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShowLoginModal(true);
    }
  }, [loading, user, setShowLoginModal]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const success = await updateProfile(name.trim(), email.trim() || undefined);
    setSaving(false);
    if (success) {
      setSaved(true);
      setEditMode(false);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF8F9] md:bg-background pb-20">
      {/* Header: compact on mobile, full on desktop */}
      <div className="hidden md:block">
        <SiteHeader />
      </div>
      <div className="md:hidden sticky top-0 z-50 bg-white/97 backdrop-blur-md border-b border-pink-100/60 px-4 py-3">
        <h1 className="text-base font-bold text-foreground font-serif">My Account</h1>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-4 md:py-6 space-y-3 md:space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
              {(user.name || user.phone)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground font-serif truncate">{user.name || "Guest"}</h2>
              <p className="text-sm text-muted-foreground">+91 {user.phone}</p>
              {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-xs text-primary font-medium hover:underline flex-shrink-0"
            >
              {editMode ? "Cancel" : "Edit"}
            </button>
          </div>

          {/* Inline Edit */}
          {editMode && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                  <UserIcon className="w-3 h-3" /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                  <Mail className="w-3 h-3" /> Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <Link
            href="/orders"
            className="flex items-center gap-3 px-5 py-4 text-sm text-foreground hover:bg-muted/50 transition-colors border-b border-border"
          >
            <Package className="w-5 h-5 text-primary" />
            <span className="flex-1 font-medium">My Orders</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
          <Link
            href="/addresses"
            className="flex items-center gap-3 px-5 py-4 text-sm text-foreground hover:bg-muted/50 transition-colors border-b border-border"
          >
            <MapPin className="w-5 h-5 text-primary" />
            <span className="flex-1 font-medium">Manage Addresses</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
          <Link
            href="/offers"
            className="flex items-center gap-3 px-5 py-4 text-sm text-foreground hover:bg-muted/50 transition-colors"
          >
            <Heart className="w-5 h-5 text-primary" />
            <span className="flex-1 font-medium">Offers</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        {/* Admin Link */}
        {(user.role === "ADMIN" || user.role === "STAFF") && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-5 py-4 text-sm text-primary font-medium hover:bg-primary/5 transition-colors"
            >
              <Shield className="w-5 h-5" />
              <span className="flex-1">Admin Panel</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Logout */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-5 py-4 text-sm text-destructive hover:bg-red-50 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground pt-2">Powered by Bliss Bakery</p>
      </div>
    </div>
  );
}
