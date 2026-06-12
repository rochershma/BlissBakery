"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Navigation, Search, X, Home, Briefcase, AlertCircle, Loader2, Check, Plus } from "lucide-react";

export interface DeliveryServiceability {
  serviceable: boolean;
  distanceKm: number;
  deliveryFee: number;
  reason?: string;
}

export interface DeliveryTier {
  maxKm: number;
  fee: number;
}

const DEFAULT_TIERS: DeliveryTier[] = [
  { maxKm: 3, fee: 0 },
  { maxKm: 6, fee: 30 },
  { maxKm: 10, fee: 50 },
];

let _storeLat = 27.1517;
let _storeLng = 74.8560;
let _tiers: DeliveryTier[] = DEFAULT_TIERS;

export function setDeliveryConfig(storeLat: number, storeLng: number, tiers: DeliveryTier[]) {
  _storeLat = storeLat;
  _storeLng = storeLng;
  _tiers = tiers.length > 0 ? tiers.sort((a, b) => a.maxKm - b.maxKm) : DEFAULT_TIERS;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateServiceability(lat: number, lng: number): DeliveryServiceability {
  const dist = haversineKm(_storeLat, _storeLng, lat, lng);
  const d = Math.round(dist * 10) / 10;
  for (const tier of _tiers) {
    if (dist <= tier.maxKm) return { serviceable: true, distanceKm: d, deliveryFee: tier.fee };
  }
  return { serviceable: false, distanceKm: d, deliveryFee: 0, reason: "Outside delivery area" };
}

interface SavedAddr {
  id: string; label: string; fullAddress: string; landmark: string | null;
  city: string | null; pincode: string; latitude: number | null; longitude: number | null;
}

interface Props {
  savedAddresses: SavedAddr[];
  selectedAddressId: string;
  onSelectAddress: (formattedAddr: string, addrId?: string, svc?: DeliveryServiceability) => void;
  onServiceability?: (s: DeliveryServiceability) => void;
  onAddressSaved?: () => void;
  storePincode: string;
}

// ── Add New Address Modal ──
function AddAddressModal({ onClose, onSaved, storePincode, onServiceability }: {
  onClose: () => void;
  onSaved: (addr: { fullAddress: string; lat: number; lng: number; svc: DeliveryServiceability }) => void;
  storePincode: string;
  onServiceability?: (s: DeliveryServiceability) => void;
}) {
  const [step, setStep] = useState<"search" | "details">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pickedPlace, setPickedPlace] = useState<{ name: string; address: string; lat: number; lng: number } | null>(null);
  const [details, setDetails] = useState({ flatHouse: "", landmark: "", label: "Home" });
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [svcResult, setSvcResult] = useState<DeliveryServiceability | null>(null);
  const [saving, setSaving] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const placesRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapsReady, setMapsReady] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return;
    if (typeof (globalThis as any).google !== "undefined" && (globalThis as any).google?.maps?.places) {
      setMapsReady(true);
      autocompleteRef.current = new (globalThis as any).google.maps.places.AutocompleteService();
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    s.async = true;
    s.onload = () => { setMapsReady(true); autocompleteRef.current = new (globalThis as any).google.maps.places.AutocompleteService(); };
    document.head.appendChild(s);
  }, []);

  // Auto-focus search on open
  useEffect(() => {
    if (mapsReady && step === "search") {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [mapsReady, step]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const searchPlaces = useCallback((input: string) => {
    if (!autocompleteRef.current || input.length < 3) { setPredictions([]); return; }
    setSearchLoading(true);
    autocompleteRef.current.getPlacePredictions(
      { input, componentRestrictions: { country: "in" }, locationBias: { center: { lat: _storeLat, lng: _storeLng }, radius: 15000 } },
      (r: any, st: string) => { setSearchLoading(false); setPredictions(st === "OK" && r ? r : []); }
    );
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => searchPlaces(val), 300);
  };

  const selectPrediction = (p: any) => {
    if (!placesRef.current) { const d = document.createElement("div"); placesRef.current = new (globalThis as any).google.maps.places.PlacesService(d); }
    placesRef.current.getDetails({ placeId: p.place_id, fields: ["formatted_address", "geometry", "name"] }, (place: any, st: string) => {
      if (st === "OK" && place?.geometry?.location) {
        const lat = place.geometry.location.lat(), lng = place.geometry.location.lng();
        const svc = calculateServiceability(lat, lng);
        setSvcResult(svc); onServiceability?.(svc);
        setPickedPlace({ name: p.structured_formatting.main_text, address: place.formatted_address || p.description, lat, lng });
        setPredictions([]); setSearchQuery(""); setStep("details");
      }
    });
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) { setLocError("Geolocation not supported"); return; }
    setLocating(true); setLocError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const svc = calculateServiceability(lat, lng); setSvcResult(svc); onServiceability?.(svc);
        let addr = "";
        let placeName = "Current Location";
        try {
          // Use client-side Google Maps Geocoder (no billing required, uses loaded JS library)
          const google = (globalThis as any).google;
          if (google?.maps?.Geocoder) {
            const geocoder = new google.maps.Geocoder();
            const result = await new Promise<any>((resolve) => {
              geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
                resolve(status === "OK" && results?.[0] ? results[0] : null);
              });
            });
            if (result) {
              addr = result.formatted_address || "";
              const locality = result.address_components?.find((c: any) =>
                c.types.includes("sublocality_level_1") || c.types.includes("locality") || c.types.includes("neighborhood")
              );
              if (locality) placeName = locality.long_name;
            }
          }
        } catch {}
        if (!addr) addr = `Near ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
        setPickedPlace({ name: placeName, address: addr, lat, lng }); setLocating(false); setStep("details");
      },
      (err) => { setLocating(false); setLocError(err.code === 1 ? "Location permission denied" : "Could not detect location"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveAddress = async () => {
    if (!pickedPlace) return;
    setSaving(true);
    const fullAddr = [details.flatHouse, pickedPlace.address, details.landmark].filter(Boolean).join(", ");
    try {
      const pincodeMatch = fullAddr.match(/\b\d{6}\b/);
      await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: details.label,
          fullAddress: fullAddr,
          landmark: details.landmark || null,
          city: "Kuchaman City",
          state: "Rajasthan",
          pincode: pincodeMatch?.[0] || "341508",
          latitude: pickedPlace.lat,
          longitude: pickedPlace.lng,
        }),
      });
      onSaved({ fullAddress: fullAddr, lat: pickedPlace.lat, lng: pickedPlace.lng, svc: svcResult! });
    } catch {
      onSaved({ fullAddress: fullAddr, lat: pickedPlace.lat, lng: pickedPlace.lng, svc: svcResult! });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <h3 className="font-serif font-bold text-base text-foreground">Add New Address</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center no-min-touch">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {step === "search" && (
            <>
              {/* Google Places search */}
              {mapsReady ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => handleSearchInput(e.target.value)}
                    placeholder="Search area, street, locality..." aria-label="Search delivery address"
                    className="w-full pl-10 pr-9 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  {searchQuery && <button onClick={() => { setSearchQuery(""); setPredictions([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 no-min-touch"><X className="w-4 h-4 text-muted-foreground" /></button>}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">Loading address search...</p>
              )}

              {searchLoading && <p className="text-xs text-muted-foreground px-1">Searching...</p>}

              {predictions.length > 0 && (
                <ul role="listbox" className="border border-border rounded-xl overflow-hidden bg-white divide-y divide-border/50 max-h-[240px] overflow-y-auto">
                  {predictions.map((p: any) => (
                    <li key={p.place_id} role="option">
                      <button onClick={() => selectPrediction(p)} className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors text-sm no-min-touch">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{p.structured_formatting.main_text}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{p.structured_formatting.secondary_text}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {predictions.length === 0 && (
                <>
                  {/* Current location */}
                  <button onClick={handleCurrentLocation} disabled={locating}
                    className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl border border-blue-200 bg-blue-50/50 text-sm text-blue-700 font-medium hover:bg-blue-100 transition-colors no-min-touch">
                    {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                    {locating ? "Detecting..." : "Use current location"}
                  </button>
                  {locError && <p className="text-xs text-destructive">{locError}</p>}
                  <p className="text-xs text-muted-foreground text-center pt-2">Search for your area or use current location to add an address</p>
                </>
              )}
            </>
          )}

          {step === "details" && pickedPlace && (
            <>
              {/* Picked place summary */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{pickedPlace.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{pickedPlace.address}</p>
                  </div>
                  <button onClick={() => { setStep("search"); setPickedPlace(null); setSvcResult(null); }} className="text-xs text-primary font-medium no-min-touch flex-shrink-0">Change</button>
                </div>
              </div>

              {/* Serviceability badge */}
              {svcResult && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${svcResult.serviceable ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-destructive border border-red-200"}`}>
                  {svcResult.serviceable
                    ? <><Check className="w-3.5 h-3.5" /> Delivery available{svcResult.distanceKm > 0 ? ` · ${svcResult.distanceKm} km` : ""} · {svcResult.deliveryFee === 0 ? "Free delivery" : `₹${svcResult.deliveryFee} delivery`}</>
                    : <><AlertCircle className="w-3.5 h-3.5" /> {svcResult.reason || "Outside delivery area"}</>}
                </div>
              )}

              {/* Address label */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Save as</label>
                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((l) => (
                    <button key={l} onClick={() => setDetails({ ...details, label: l })}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border-2 transition-colors ${details.label === l ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary/40"}`}>
                      {l === "Home" && <Home className="w-3 h-3" />}
                      {l === "Work" && <Briefcase className="w-3 h-3" />}
                      {l === "Other" && <MapPin className="w-3 h-3" />}
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details inputs */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">House / Flat / Floor <span className="text-destructive">*</span></label>
                <input value={details.flatHouse} onChange={(e) => setDetails({ ...details, flatHouse: e.target.value })} placeholder="e.g., Flat 201, 2nd Floor" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Landmark <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input value={details.landmark} onChange={(e) => setDetails({ ...details, landmark: e.target.value })} placeholder="Near hospital, school, etc." className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </>
          )}
        </div>

        {/* Footer CTA */}
        {step === "details" && pickedPlace && (
          <div className="px-4 py-3 border-t border-border flex-shrink-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <button onClick={handleSaveAddress} disabled={!svcResult?.serviceable || saving || !details.flatHouse.trim()}
              className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 hover:bg-primary-hover transition-colors flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : svcResult?.serviceable ? "Save Address" : "Not serviceable — choose pickup"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function DeliveryAddressSection({ savedAddresses, selectedAddressId, onSelectAddress, onServiceability, onAddressSaved, storePincode }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [svcResult, setSvcResult] = useState<DeliveryServiceability | null>(null);

  const handleSelectSaved = (addr: SavedAddr) => {
    if (addr.latitude && addr.longitude) {
      const svc = calculateServiceability(addr.latitude, addr.longitude);
      setSvcResult(svc); onServiceability?.(svc);
      onSelectAddress([addr.fullAddress, addr.city, addr.pincode].filter(Boolean).join(", "), addr.id, svc);
    } else {
      const svc: DeliveryServiceability = addr.pincode === storePincode
        ? { serviceable: true, distanceKm: 0, deliveryFee: 30 }
        : { serviceable: false, distanceKm: 0, deliveryFee: 0, reason: `Outside delivery area (${storePincode})` };
      setSvcResult(svc); onServiceability?.(svc);
      if (svc.serviceable) onSelectAddress([addr.fullAddress, addr.city, addr.pincode].filter(Boolean).join(", "), addr.id, svc);
    }
  };

  const handleAddressSaved = (result: { fullAddress: string; lat: number; lng: number; svc: DeliveryServiceability }) => {
    setShowModal(false);
    setSvcResult(result.svc); onServiceability?.(result.svc);
    if (result.svc.serviceable) {
      onSelectAddress(result.fullAddress, undefined, result.svc);
    }
    onAddressSaved?.(); // Trigger parent to refetch saved addresses
  };

  return (
    <>
      <div className="space-y-3">
        {/* Saved addresses */}
        {savedAddresses.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Saved addresses</p>
            {savedAddresses.map((addr) => {
              const sel = selectedAddressId === addr.id;
              const addrSvc = addr.latitude && addr.longitude
                ? calculateServiceability(addr.latitude, addr.longitude)
                : (addr.pincode === storePincode ? { serviceable: true, distanceKm: 0, deliveryFee: 30 } as DeliveryServiceability : { serviceable: false, distanceKm: 0, deliveryFee: 0, reason: "Outside area" } as DeliveryServiceability);
              return (
                <button key={addr.id} onClick={() => handleSelectSaved(addr)} disabled={!addrSvc.serviceable}
                  className={`w-full flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all no-min-touch ${!addrSvc.serviceable ? "opacity-50 border-border cursor-not-allowed" : sel ? "bg-primary/5 border-primary" : "bg-white border-border hover:border-primary/40"}`}>
                  {addr.label === "Home" ? <Home className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /> : addr.label === "Work" ? <Briefcase className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /> : <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{addr.label || "Address"}</p>
                      {addrSvc.serviceable && <span className="text-[10px] text-green-600 font-medium">{addrSvc.distanceKm > 0 ? `${addrSvc.distanceKm} km · ` : ""}{addrSvc.deliveryFee === 0 ? "Free" : `₹${addrSvc.deliveryFee}`}</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{addr.fullAddress}</p>
                    {!addrSvc.serviceable && <p className="text-[10px] text-destructive mt-1">Outside delivery area</p>}
                  </div>
                  {sel && <Check className="w-4 h-4 text-primary flex-shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Add New Address button */}
        <button onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-primary/40 text-sm text-primary font-semibold hover:bg-primary/5 hover:border-primary transition-colors">
          <Plus className="w-4 h-4" />
          Add New Address
        </button>
      </div>

      {/* Add Address Modal */}
      {showModal && (
        <AddAddressModal
          onClose={() => setShowModal(false)}
          onSaved={handleAddressSaved}
          storePincode={storePincode}
          onServiceability={onServiceability}
        />
      )}
    </>
  );
}
