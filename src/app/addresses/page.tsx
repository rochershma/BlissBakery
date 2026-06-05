"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { SiteHeader } from "@/components/shared/site-header";
import { useToast } from "@/components/shared/toast";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Plus, Trash2, Home, Building2, Check } from "lucide-react";
import Link from "next/link";

interface Address {
  id: string;
  label: string;
  fullAddress: string;
  landmark: string | null;
  city: string | null;
  state: string | null;
  pincode: string;
  isDefault: boolean;
}

const emptyForm = { label: "Home", flatHouse: "", streetArea: "", landmark: "", city: "", state: "Rajasthan", pincode: "" };

export default function AddressesPage() {
  const { user, loading, setShowLoginModal } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pincodeError, setPincodeError] = useState("");
  const [storePin, setStorePin] = useState("");
  const [storeCity, setStoreCity] = useState("");

  useEffect(() => {
    if (!loading && !user) setShowLoginModal(true);
  }, [loading, user, setShowLoginModal]);

  useEffect(() => {
    if (user) {
      fetch("/api/addresses").then((r) => r.json()).then((data) => {
        if (data.addresses) setAddresses(data.addresses);
      });
      fetch("/api/store/config").then((r) => r.json()).then((data) => {
        if (data.pincode) setStorePin(data.pincode);
        if (data.city) setStoreCity(data.city);
      });
    }
  }, [user]);

  const validatePincode = (pin: string) => {
    if (pin.length !== 6 || !storePin) { setPincodeError(""); return; }
    if (pin !== storePin) {
      setPincodeError(`We currently deliver only to ${storePin} (${storeCity || "Store area"}). Your pincode is not serviceable.`);
    } else {
      setPincodeError("");
    }
  };

  const handleSave = async () => {
    if (!form.flatHouse.trim() || !form.streetArea.trim() || !form.pincode.trim()) {
      toast("Please fill all required fields", "error");
      return;
    }
    if (storePin && form.pincode !== storePin) {
      toast("This pincode is not deliverable", "error");
      return;
    }
    setSaving(true);
    try {
      const fullAddress = [form.flatHouse, form.streetArea, form.landmark].filter(Boolean).join(", ");
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          fullAddress,
          landmark: form.landmark,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses((prev) => [data.address, ...prev]);
        setForm(emptyForm);
        setShowForm(false);
        toast("Address saved!", "success");
      } else {
        const data = await res.json();
        toast(data.error || "Failed to save address", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/addresses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast("Address deleted", "info");
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
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <SiteHeader />
      <div className="max-w-2xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="p-1 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-foreground font-serif">Manage Addresses</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-border p-5 mb-4 space-y-4">
            <h3 className="font-semibold text-foreground font-serif">Add New Address</h3>

            {/* Label */}
            <div className="flex gap-2">
              {["Home", "Office", "Other"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setForm({ ...form, label })}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                    form.label === label ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {label === "Home" ? <Home className="w-3 h-3" /> : label === "Office" ? <Building2 className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                  {label}
                </button>
              ))}
            </div>

            {/* Flat / House / Building */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Flat / House No. / Building *</label>
              <input
                value={form.flatHouse}
                onChange={(e) => setForm({ ...form, flatHouse: e.target.value })}
                placeholder="e.g., 42-A, Shiv Colony"
                className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Street / Area / Locality */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Street / Area / Locality *</label>
              <input
                value={form.streetArea}
                onChange={(e) => setForm({ ...form, streetArea: e.target.value })}
                placeholder="e.g., Main Market Road, Near Bus Stand"
                className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Landmark */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Landmark (optional)</label>
              <input
                value={form.landmark}
                onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                placeholder="e.g., Opposite SBI Bank"
                className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* City */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">City *</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Kuchaman City"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              {/* State */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">State</label>
                <input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="Rajasthan"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Pincode */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Pincode *</label>
              <input
                value={form.pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setForm({ ...form, pincode: val });
                  validatePincode(val);
                }}
                placeholder="6-digit Pincode"
                inputMode="numeric"
                maxLength={6}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  pincodeError ? "border-red-400 bg-red-50" : "border-border"
                }`}
              />
              {pincodeError && (
                <p className="text-xs text-red-600 mt-1 flex items-start gap-1">
                  <span className="text-red-500 mt-0.5">⚠</span> {pincodeError}
                </p>
              )}
              {form.pincode.length === 6 && !pincodeError && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Delivery available to this pincode
                </p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={!form.flatHouse || !form.streetArea || !form.pincode || form.pincode.length !== 6 || !!pincodeError || saving}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Address"}
            </button>
          </div>
        )}

        {/* Saved Addresses */}
        {addresses.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📍</div>
            <h2 className="text-xl font-bold text-foreground font-serif mb-2">No saved addresses</h2>
            <p className="text-muted-foreground mb-4">Add an address for faster delivery checkout</p>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary-hover transition-colors">
              <Plus className="w-5 h-5" /> Add Address
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-white rounded-2xl border border-border p-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {addr.label === "Home" ? <Home className="w-5 h-5 text-primary" /> : addr.label === "Office" ? <Building2 className="w-5 h-5 text-primary" /> : <MapPin className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{addr.label || "Address"}</span>
                      {addr.isDefault && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{addr.fullAddress}</p>
                    {addr.landmark && <p className="text-xs text-muted-foreground">Near: {addr.landmark}</p>}
                    <p className="text-xs text-muted-foreground">{[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(addr.id)} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive transition-colors">
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
