"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Navigation, Search, X, Home, Briefcase, Plus, ChevronRight, AlertCircle, Loader2, Check } from "lucide-react";

// Types
export type AddressLabel = "Home" | "Work" | "Other";

export interface DeliveryAddress {
  id?: string;
  label: AddressLabel;
  line1: string;
  line2?: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  formattedAddress: string;
}

export interface DeliveryServiceability {
  serviceable: boolean;
  distanceKm: number;
  deliveryFee: number;
  reason?: string;
}

// Store coordinates
const STORE_LAT = 27.1517;
const STORE_LNG = 74.8560;
const DELIVERY_RADIUS_KM = 10;

// Haversine distance
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateServiceability(lat: number, lng: number): DeliveryServiceability {
  const dist = haversineKm(STORE_LAT, STORE_LNG, lat, lng);
  const distRounded = Math.round(dist * 10) / 10;
  if (dist <= 3) return { serviceable: true, distanceKm: distRounded, deliveryFee: 0 };
  if (dist <= 6) return { serviceable: true, distanceKm: distRounded, deliveryFee: 30 };
  if (dist <= DELIVERY_RADIUS_KM) return { serviceable: true, distanceKm: distRounded, deliveryFee: 50 };
  return { serviceable: false, distanceKm: distRounded, deliveryFee: 0, reason: "Outside delivery area" };
}

// Saved address from API
interface SavedAddr {
  id: string;
  label: string;
  fullAddress: string;
  landmark: string | null;
  city: string | null;
  pincode: string;
}

interface Props {
  savedAddresses: SavedAddr[];
  selectedAddressId: string;
  onSelectSaved: (id: string, formattedAddr: string) => void;
  onManualAddress: (addr: string) => void;
  onServiceability?: (s: DeliveryServiceability) => void;
  storePincode: string;
}

export function DeliveryAddressSection({ savedAddresses, selectedAddressId, onSelectSaved, onManualAddress, onServiceability, storePincode }: Props) {
  const [mode, setMode] = useState<"saved" | "search" | "manual">(savedAddresses.length > 0 ? "saved" : "manual");
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ formatted: string; lat: number; lng: number } | null>(null);
  const [manualAddr, setManualAddr] = useState({ flatHouse: "", streetArea: "", landmark: "", city: "Kuchaman City", pincode: "" });
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const placesRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if Google Maps API is available
  const [mapsAvailable, setMapsAvailable] = useState(false);
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return;

    // Load Google Maps script lazily
    if (typeof (globalThis as any).google !== "undefined" && (globalThis as any).google?.maps?.places) {
      setMapsAvailable(true);
      autocompleteRef.current = new (globalThis as any).google.maps.places.AutocompleteService();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.onload = () => {
      setMapsAvailable(true);
      autocompleteRef.current = new (globalThis as any).google.maps.places.AutocompleteService();
    };
    document.head.appendChild(script);
  }, []);

  const searchPlaces = useCallback((input: string) => {
    if (!autocompleteRef.current || input.length < 3) {
      setPredictions([]);
      return;
    }
    setSearchLoading(true);
    autocompleteRef.current.getPlacePredictions({
      input,
      componentRestrictions: { country: "in" },
      locationBias: { center: { lat: STORE_LAT, lng: STORE_LNG }, radius: 15000 } as any,
    }, (results: any, status: string) => {
      setSearchLoading(false);
      if (status === "OK" && results) {
        setPredictions(results);
      } else {
        setPredictions([]);
      }
    });
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => searchPlaces(val), 300);
  };

  const selectPrediction = (prediction: any) => {
    if (!placesRef.current) {
      const div = document.createElement("div");
      placesRef.current = new (globalThis as any).google.maps.places.PlacesService(div);
    }
    placesRef.current.getDetails({
      placeId: prediction.place_id,
      fields: ["formatted_address", "geometry", "address_components"],
    }, (place: any, status: string) => {
      if (status === "OK" && place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formatted = place.formatted_address || prediction.description;
        setSelectedPlace({ formatted, lat, lng });
        setSearchQuery(prediction.description);
        setPredictions([]);

        const svc = calculateServiceability(lat, lng);
        onServiceability?.(svc);
        if (svc.serviceable) {
          onManualAddress(formatted);
        }
      }
    });
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported");
      return;
    }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const svc = calculateServiceability(latitude, longitude);
        onServiceability?.(svc);

        // Reverse geocode
        try {
          const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (key) {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${key}`);
            const data = await res.json();
            if (data.results?.[0]) {
              const formatted = data.results[0].formatted_address;
              setSelectedPlace({ formatted, lat: latitude, lng: longitude });
              setSearchQuery(formatted);
              if (svc.serviceable) onManualAddress(formatted);
            }
          } else {
            setSelectedPlace({ formatted: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, lat: latitude, lng: longitude });
          }
        } catch {
          setSelectedPlace({ formatted: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, lat: latitude, lng: longitude });
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setLocError("Location permission denied");
        else setLocError("Could not detect location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManualSubmit = () => {
    if (!manualAddr.flatHouse.trim() || !manualAddr.streetArea.trim()) return;
    const formatted = [manualAddr.flatHouse, manualAddr.streetArea, manualAddr.landmark, manualAddr.city, manualAddr.pincode].filter(Boolean).join(", ");
    onManualAddress(formatted);

    // Check pincode serviceability
    if (manualAddr.pincode && manualAddr.pincode !== storePincode) {
      onServiceability?.({ serviceable: false, distanceKm: 0, deliveryFee: 0, reason: `We only deliver to ${storePincode} area` });
    } else if (manualAddr.pincode === storePincode) {
      onServiceability?.({ serviceable: true, distanceKm: 0, deliveryFee: 30 });
    }
  };

  const labelIcon = (label: string) => {
    if (label === "Home") return <Home className="w-4 h-4 text-primary" />;
    if (label === "Work") return <Briefcase className="w-4 h-4 text-primary" />;
    return <MapPin className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex gap-2">
        {savedAddresses.length > 0 && (
          <button onClick={() => setMode("saved")} className={`no-min-touch flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${mode === "saved" ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border"}`}>
            Saved
          </button>
        )}
        {mapsAvailable && (
          <button onClick={() => { setMode("search"); setTimeout(() => searchInputRef.current?.focus(), 100); }} className={`no-min-touch flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${mode === "search" ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border"}`}>
            Search
          </button>
        )}
        <button onClick={() => setMode("manual")} className={`no-min-touch flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${mode === "manual" ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border"}`}>
          Manual
        </button>
      </div>

      {/* Current location button */}
      <button
        onClick={handleCurrentLocation}
        disabled={locating}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-sm text-blue-700 font-medium hover:bg-blue-100 transition-colors no-min-touch"
      >
        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
        {locating ? "Detecting location..." : "Use current location"}
      </button>
      {locError && <p className="text-xs text-destructive">{locError}</p>}

      {/* Serviceability message */}
      {selectedPlace && (
        <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
          (() => { const s = calculateServiceability(selectedPlace.lat, selectedPlace.lng); return s.serviceable ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-destructive border border-red-200"; })()
        }`}>
          {(() => {
            const s = calculateServiceability(selectedPlace.lat, selectedPlace.lng);
            return s.serviceable ? (
              <><MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> Delivery available · {s.distanceKm} km · {s.deliveryFee === 0 ? "Free delivery" : `₹${s.deliveryFee} delivery`}</>
            ) : (
              <><AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {s.reason || "Outside delivery area"}. Choose pickup or contact us.</>
            );
          })()}
        </div>
      )}

      {/* Saved addresses */}
      {mode === "saved" && (
        <div className="space-y-2">
          {savedAddresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            const notDeliverable = addr.pincode !== storePincode;
            return (
              <button
                key={addr.id}
                onClick={() => { if (!notDeliverable) onSelectSaved(addr.id, addr.fullAddress); }}
                disabled={notDeliverable}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all no-min-touch ${
                  notDeliverable ? "opacity-50 border-border cursor-not-allowed" :
                  isSelected ? "bg-primary/5 border-primary" : "bg-white border-border hover:border-primary/40"
                }`}
              >
                {labelIcon(addr.label)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{addr.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{addr.fullAddress}</p>
                  {notDeliverable && <p className="text-[10px] text-destructive mt-1">Outside delivery area</p>}
                </div>
                {isSelected && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div>}
              </button>
            );
          })}
          <button onClick={() => setMode("manual")} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors no-min-touch">
            <Plus className="w-4 h-4" /> Add new address
          </button>
        </div>
      )}

      {/* Google Places search */}
      {mode === "search" && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search house, street, area..."
              className="w-full pl-10 pr-9 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              aria-label="Search delivery address"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setPredictions([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 no-min-touch">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          {searchLoading && <p className="text-xs text-muted-foreground px-1">Searching...</p>}
          {predictions.length > 0 && (
            <ul role="listbox" className="border border-border rounded-xl overflow-hidden bg-white divide-y divide-border/50">
              {predictions.map((p) => (
                <li key={p.place_id} role="option" aria-selected={false}>
                  <button
                    onClick={() => selectPrediction(p)}
                    className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors text-sm no-min-touch"
                  >
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{p.structured_formatting.main_text}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.structured_formatting.secondary_text}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!searchLoading && searchQuery.length >= 3 && predictions.length === 0 && (
            <p className="text-xs text-muted-foreground px-1">No results. Try a different search or <button onClick={() => setMode("manual")} className="text-primary font-medium">enter manually</button>.</p>
          )}
        </div>
      )}

      {/* Manual address form */}
      {mode === "manual" && (
        <div className="space-y-2.5">
          <input
            type="text"
            placeholder="Flat / House / Floor *"
            value={manualAddr.flatHouse}
            onChange={(e) => setManualAddr({ ...manualAddr, flatHouse: e.target.value })}
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="text"
            placeholder="Street / Area *"
            value={manualAddr.streetArea}
            onChange={(e) => setManualAddr({ ...manualAddr, streetArea: e.target.value })}
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="text"
            placeholder="Landmark (optional)"
            value={manualAddr.landmark}
            onChange={(e) => setManualAddr({ ...manualAddr, landmark: e.target.value })}
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="City"
              value={manualAddr.city}
              onChange={(e) => setManualAddr({ ...manualAddr, city: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="text"
              placeholder="Pincode *"
              value={manualAddr.pincode}
              maxLength={6}
              onChange={(e) => setManualAddr({ ...manualAddr, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={handleManualSubmit}
            disabled={!manualAddr.flatHouse.trim() || !manualAddr.streetArea.trim() || manualAddr.pincode.length !== 6}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 transition-colors hover:bg-primary-hover"
          >
            Use This Address
          </button>
        </div>
      )}
    </div>
  );
}
