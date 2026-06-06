"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Navigation, Search, X, Home, Briefcase, AlertCircle, Loader2, Check, ChevronLeft } from "lucide-react";

// Types
export interface DeliveryServiceability {
  serviceable: boolean;
  distanceKm: number;
  deliveryFee: number;
  reason?: string;
}

const STORE_LAT = 27.1517;
const STORE_LNG = 74.8560;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateServiceability(lat: number, lng: number): DeliveryServiceability {
  const dist = haversineKm(STORE_LAT, STORE_LNG, lat, lng);
  const d = Math.round(dist * 10) / 10;
  if (dist <= 3) return { serviceable: true, distanceKm: d, deliveryFee: 0 };
  if (dist <= 6) return { serviceable: true, distanceKm: d, deliveryFee: 30 };
  if (dist <= 10) return { serviceable: true, distanceKm: d, deliveryFee: 50 };
  return { serviceable: false, distanceKm: d, deliveryFee: 0, reason: "Outside delivery area" };
}

interface SavedAddr { id: string; label: string; fullAddress: string; landmark: string | null; city: string | null; pincode: string; }

interface Props {
  savedAddresses: SavedAddr[];
  selectedAddressId: string;
  onSelectAddress: (formattedAddr: string, addrId?: string) => void;
  onServiceability?: (s: DeliveryServiceability) => void;
  storePincode: string;
}

export function DeliveryAddressSection({ savedAddresses, selectedAddressId, onSelectAddress, onServiceability, storePincode }: Props) {
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pickedPlace, setPickedPlace] = useState<{ name: string; address: string; lat?: number; lng?: number } | null>(null);
  const [details, setDetails] = useState({ flatHouse: "", landmark: "" });
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [svcResult, setSvcResult] = useState<DeliveryServiceability | null>(null);
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

  const searchPlaces = useCallback((input: string) => {
    if (!autocompleteRef.current || input.length < 3) { setPredictions([]); return; }
    setSearchLoading(true);
    autocompleteRef.current.getPlacePredictions(
      { input, componentRestrictions: { country: "in" }, locationBias: { center: { lat: STORE_LAT, lng: STORE_LNG }, radius: 15000 } },
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
        let addr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (key) { const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`); const d = await r.json(); if (d.results?.[0]) addr = d.results[0].formatted_address; }
        } catch {}
        setPickedPlace({ name: "Current Location", address: addr, lat, lng }); setLocating(false); setStep("details");
      },
      (err) => { setLocating(false); setLocError(err.code === 1 ? "Location permission denied. Search or enter address below." : "Could not detect location."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectSaved = (addr: SavedAddr) => {
    const svc: DeliveryServiceability = addr.pincode === storePincode
      ? { serviceable: true, distanceKm: 0, deliveryFee: 30 }
      : { serviceable: false, distanceKm: 0, deliveryFee: 0, reason: `We deliver only to ${storePincode} area` };
    setSvcResult(svc); onServiceability?.(svc);
    onSelectAddress([addr.fullAddress, addr.city, addr.pincode].filter(Boolean).join(", "), addr.id);
  };

  const handleConfirmDetails = () => {
    if (!pickedPlace) return;
    onSelectAddress([details.flatHouse, pickedPlace.address, details.landmark].filter(Boolean).join(", "));
  };

  const handleManualConfirm = (flat: string, street: string, landmark: string, pin: string) => {
    onSelectAddress([flat, street, landmark, "Kuchaman City", pin].filter(Boolean).join(", "));
    const svc: DeliveryServiceability = pin === storePincode
      ? { serviceable: true, distanceKm: 0, deliveryFee: 30 }
      : { serviceable: false, distanceKm: 0, deliveryFee: 0, reason: `We deliver only to ${storePincode} area` };
    setSvcResult(svc); onServiceability?.(svc);
  };

  // ── Step 2: Add house/flat details after picking location ──
  if (step === "details" && pickedPlace) {
    return (
      <div className="space-y-3">
        <button onClick={() => { setStep("pick"); setPickedPlace(null); }} className="flex items-center gap-1 text-xs text-primary font-medium no-min-touch">
          <ChevronLeft className="w-3 h-3" /> Change address
        </button>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div><p className="text-sm font-semibold text-foreground">{pickedPlace.name}</p><p className="text-xs text-muted-foreground mt-0.5">{pickedPlace.address}</p></div>
          </div>
        </div>
        {svcResult && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${svcResult.serviceable ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-destructive border border-red-200"}`}>
            {svcResult.serviceable
              ? <><Check className="w-3.5 h-3.5" /> Delivery available{svcResult.distanceKm > 0 ? ` · ${svcResult.distanceKm} km` : ""} · {svcResult.deliveryFee === 0 ? "Free" : `₹${svcResult.deliveryFee}`}</>
              : <><AlertCircle className="w-3.5 h-3.5" /> {svcResult.reason}</>}
          </div>
        )}
        <input value={details.flatHouse} onChange={(e) => setDetails({ ...details, flatHouse: e.target.value })} placeholder="House / Flat / Floor (optional)" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <input value={details.landmark} onChange={(e) => setDetails({ ...details, landmark: e.target.value })} placeholder="Landmark (optional)" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <button onClick={handleConfirmDetails} disabled={!svcResult?.serviceable} className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 hover:bg-primary-hover transition-colors">
          {svcResult?.serviceable ? "Deliver Here" : "Not serviceable"}
        </button>
      </div>
    );
  }

  // ── Step 1: Pick location ──
  return (
    <div className="space-y-3">
      {mapsReady && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search area, street, locality..." aria-label="Search delivery address"
            className="w-full pl-10 pr-9 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          {searchQuery && <button onClick={() => { setSearchQuery(""); setPredictions([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 no-min-touch"><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
      )}
      {searchLoading && <p className="text-xs text-muted-foreground px-1">Searching...</p>}
      {predictions.length > 0 && (
        <ul role="listbox" className="border border-border rounded-xl overflow-hidden bg-white divide-y divide-border/50 max-h-[240px] overflow-y-auto">
          {predictions.map((p: any) => (
            <li key={p.place_id} role="option"><button onClick={() => selectPrediction(p)} className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors text-sm no-min-touch">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="min-w-0"><p className="font-medium text-foreground truncate">{p.structured_formatting.main_text}</p><p className="text-[11px] text-muted-foreground truncate">{p.structured_formatting.secondary_text}</p></div>
            </button></li>
          ))}
        </ul>
      )}
      {predictions.length === 0 && (
        <>
          <button onClick={handleCurrentLocation} disabled={locating}
            className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl border border-blue-200 bg-blue-50/50 text-sm text-blue-700 font-medium hover:bg-blue-100 transition-colors no-min-touch">
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {locating ? "Detecting..." : "Use current location"}
          </button>
          {locError && <p className="text-xs text-muted-foreground">{locError}</p>}
          {savedAddresses.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Saved addresses</p>
              {savedAddresses.map((addr) => {
                const sel = selectedAddressId === addr.id, bad = addr.pincode !== storePincode;
                return (
                  <button key={addr.id} onClick={() => !bad && handleSelectSaved(addr)} disabled={bad}
                    className={`w-full flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all no-min-touch ${bad ? "opacity-50 border-border cursor-not-allowed" : sel ? "bg-primary/5 border-primary" : "bg-white border-border hover:border-primary/40"}`}>
                    {addr.label === "Home" ? <Home className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /> : addr.label === "Work" ? <Briefcase className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /> : <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground">{addr.label}</p><p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{addr.fullAddress}</p>{bad && <p className="text-[10px] text-destructive mt-1">Outside delivery area</p>}</div>
                    {sel && <Check className="w-4 h-4 text-primary flex-shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>
          )}
          <ManualEntry storePincode={storePincode} onConfirm={handleManualConfirm} />
        </>
      )}
    </div>
  );
}

function ManualEntry({ storePincode, onConfirm }: { storePincode: string; onConfirm: (f: string, s: string, l: string, p: string) => void }) {
  const [open, setOpen] = useState(false);
  const [flat, setFlat] = useState(""); const [street, setStreet] = useState(""); const [landmark, setLandmark] = useState(""); const [pin, setPin] = useState("");
  if (!open) return <button onClick={() => setOpen(true)} className="w-full text-center text-xs text-primary font-medium py-2 no-min-touch">Or enter address manually</button>;
  return (
    <div className="border border-border rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between"><p className="text-xs font-semibold text-foreground">Enter address</p><button onClick={() => setOpen(false)} className="text-xs text-muted-foreground no-min-touch">Cancel</button></div>
      <input value={flat} onChange={(e) => setFlat(e.target.value)} placeholder="House / Flat *" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street / Area *" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      <input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Landmark (optional)" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      <div className="flex gap-2">
        <input value="Kuchaman City" disabled className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm bg-muted/30 text-muted-foreground" />
        <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Pincode *" inputMode="numeric" maxLength={6}
          className={`w-28 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${pin.length === 6 ? (pin === storePincode ? "border-green-400" : "border-red-300") : "border-border"}`} />
      </div>
      {pin.length === 6 && pin !== storePincode && <p className="text-[10px] text-destructive">We deliver only to {storePincode} area</p>}
      <button onClick={() => onConfirm(flat, street, landmark, pin)} disabled={!flat.trim() || !street.trim() || pin.length !== 6}
        className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 hover:bg-primary-hover transition-colors">Use This Address</button>
    </div>
  );
}
