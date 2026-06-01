"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { SiteHeader } from "@/components/shared/site-header";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Plus, Trash2, Home, Building2 } from "lucide-react";
import Link from "next/link";

export default function AddressesPage() {
  const { user, loading, setShowLoginModal } = useAuth();
  const [addresses, setAddresses] = useState<{ id: string; label: string; fullAddress: string; pincode: string; isDefault: boolean }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "Home", fullAddress: "", landmark: "", pincode: "" });

  useEffect(() => {
    if (!loading && !user) {
      setShowLoginModal(true);
    }
  }, [loading, user, setShowLoginModal]);

  useEffect(() => {
    if (user) {
      fetch("/api/addresses")
        .then((r) => r.json())
        .then((data) => { if (data.addresses) setAddresses(data.addresses); });
    }
  }, [user]);

  const handleSaveAddress = async () => {
    if (!newAddress.fullAddress.trim() || !newAddress.pincode.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses((prev) => [data.address, ...prev]);
        setNewAddress({ label: "Home", fullAddress: "", landmark: "", pincode: "" });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    const res = await fetch("/api/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
  };

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
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <div className="max-w-2xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-foreground font-serif">Manage Addresses</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>

        {/* Add Address Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-border p-5 mb-4 animate-fade-in-up">
            <h3 className="font-semibold text-foreground mb-3">Add New Address</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                {["Home", "Office", "Other"].map((label) => (
                  <button
                    key={label}
                    onClick={() => setNewAddress({ ...newAddress, label })}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                      newAddress.label === label
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {label === "Home" ? <Home className="w-3 h-3" /> : label === "Office" ? <Building2 className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {label}
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Full address (house no, street, area)"
                value={newAddress.fullAddress}
                onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Landmark (optional)"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  className="px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  maxLength={6}
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  className="px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                onClick={handleSaveAddress}
                disabled={!newAddress.fullAddress || !newAddress.pincode || saving}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 btn-press"
              >
                {saving ? "Saving..." : "Save Address"}
              </button>
            </div>
          </div>
        )}

        {/* Saved Addresses */}
        {addresses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📍</div>
            <h2 className="text-xl font-bold text-foreground font-serif mb-2">No saved addresses</h2>
            <p className="text-muted-foreground mb-4">Add an address for faster delivery checkout</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary-hover transition-colors btn-press"
            >
              <Plus className="w-5 h-5" /> Add Address
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-white rounded-2xl border border-border p-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {addr.label === "Home" ? <Home className="w-5 h-5 text-primary" /> : <Building2 className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{addr.label}</span>
                      {addr.isDefault && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{addr.fullAddress}</p>
                    <p className="text-xs text-muted-foreground">{addr.pincode}</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
