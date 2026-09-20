"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconPin, IconSearch } from "./icons";

export type SavedAddress = {
  id: string;
  label: string | null;
  houseNo: string | null;
  fullAddress: string;
  landmark: string | null;
  city: string | null;
  state: string | null;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
};

type Suggestion = { placeId: string; main: string; secondary: string; distanceKm: number | null };

type Place = {
  placeId: string | null;
  fullAddress: string;
  latitude: number | null;
  longitude: number | null;
  pincode: string;
  city: string;
  state: string;
};

type Verdict = { deliverable: boolean; fee: number; distanceKm: number | null; reason: string | null };

const LABELS = ["Home", "Work", "Other"];

/** One session token per search-then-pick, which is how Google bills this. */
const newToken = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

export function AddressForm({
  initial,
  fallbackPincodes,
  fallbackCity,
  onSaved,
  onCancel,
}: {
  initial?: SavedAddress | null;
  fallbackPincodes: string[];
  fallbackCity: string;
  onSaved: (address: SavedAddress) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [placesDown, setPlacesDown] = useState(false);
  const [locating, setLocating] = useState(false);
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const [place, setPlace] = useState<Place | null>(
    initial
      ? {
          placeId: initial.placeId,
          fullAddress: initial.fullAddress,
          latitude: initial.latitude,
          longitude: initial.longitude,
          pincode: initial.pincode,
          city: initial.city ?? fallbackCity,
          state: initial.state ?? "",
        }
      : null,
  );
  const [houseNo, setHouseNo] = useState(initial?.houseNo ?? "");
  const [landmark, setLandmark] = useState(initial?.landmark ?? "");
  const [label, setLabel] = useState(initial?.label ?? "Home");
  const [manualPin, setManualPin] = useState(initial?.pincode ?? fallbackPincodes[0] ?? "");

  const token = useRef(newToken());

  // Debounced so we bill one request per pause, not per keystroke.
  useEffect(() => {
    if (place || query.trim().length < 3) { setSuggestions(null); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: query, sessionToken: token.current }),
        });
        const d = await r.json();
        if (d?.unavailable) setPlacesDown(true);
        setSuggestions(d?.suggestions ?? []);
      } catch {
        setPlacesDown(true);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, place]);

  const verify = useCallback(async (p: Place) => {
    setVerdict(null);
    const params = new URLSearchParams();
    if (p.latitude != null && p.longitude != null) {
      params.set("lat", String(p.latitude));
      params.set("lng", String(p.longitude));
    }
    if (p.pincode) params.set("pincode", p.pincode);
    try {
      const r = await fetch(`/api/delivery/check?${params}`);
      setVerdict(await r.json());
    } catch {
      setVerdict(null);
    }
  }, []);

  useEffect(() => { if (place) verify(place); }, [place, verify]);

  const pick = async (s: Suggestion) => {
    setSuggestions(null);
    setSearching(true);
    try {
      const r = await fetch(`/api/places/details?placeId=${encodeURIComponent(s.placeId)}&sessionToken=${token.current}`);
      const d = await r.json();
      if (!r.ok || !d?.fullAddress) throw new Error();
      setPlace({ ...d, city: d.city || fallbackCity });
      token.current = newToken();
    } catch {
      setError("Couldn't load that place. Try another, or enter it manually.");
      setPlacesDown(true);
    } finally {
      setSearching(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { setPlacesDown(true); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(`/api/places/reverse?lat=${latitude}&lng=${longitude}`);
          const d = await r.json();
          if (!r.ok || !d?.fullAddress) throw new Error();
          setPlace({ ...d, city: d.city || fallbackCity });
        } catch {
          setError("Couldn't read your location. Search for the area instead.");
        } finally {
          setLocating(false);
        }
      },
      () => { setLocating(false); setError("Location permission denied."); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const save = async () => {
    setError("");
    const area = place?.fullAddress?.trim() || query.trim();
    if (!area) { setError("Search for your area first"); return; }
    if (!houseNo.trim()) { setError("Add your flat or house number"); return; }
    const pincode = place?.pincode || manualPin;
    if (!/^\d{6}$/.test(pincode)) { setError("We need a valid 6-digit pincode"); return; }

    setBusy(true);
    try {
      const res = await fetch(initial ? `/api/addresses?id=${initial.id}` : "/api/addresses", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          houseNo: houseNo.trim(),
          fullAddress: area,
          landmark: landmark.trim() || null,
          city: place?.city || fallbackCity,
          state: place?.state || null,
          pincode,
          latitude: place?.latitude ?? null,
          longitude: place?.longitude ?? null,
          placeId: place?.placeId ?? null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not save this address");
      onSaved(data.address);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this address");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="addrf">
      {!place ? (
        <>
          <label className="addrf__lbl" htmlFor="addr-search">Where should we deliver?</label>
          <div className="addrf__search">
            <IconSearch />
            <input
              id="addr-search"
              className="input"
              placeholder="Search area, street or landmark"
              value={query}
              autoComplete="off"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <button type="button" className="addrf__gps" onClick={useMyLocation} disabled={locating}>
            <IconPin /> {locating ? "Finding you…" : "Use my current location"}
          </button>

          {searching ? <p className="t-small addrf__hint">Searching…</p> : null}

          {suggestions && suggestions.length > 0 ? (
            <ul className="addrf__list">
              {suggestions.map((s) => (
                <li key={s.placeId}>
                  <button type="button" onClick={() => pick(s)}>
                    <IconPin />
                    <span>
                      <b>{s.main}</b>
                      <small>{s.secondary}</small>
                    </span>
                    {s.distanceKm != null ? <em>{s.distanceKm.toFixed(1)} km</em> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {suggestions && suggestions.length === 0 && query.trim().length >= 3 && !searching ? (
            <p className="t-small addrf__hint">No matches. Check the spelling, or enter it manually below.</p>
          ) : null}

          {!manual && !placesDown ? (
            <button type="button" className="addrf__manualLink" onClick={() => setManual(true)}>
              Can&apos;t find it? Enter manually
            </button>
          ) : null}

          {manual || placesDown ? (
            <div className="addrf__manual">
              <p className="t-small">Type the area and pincode</p>
              <input
                className="input"
                placeholder="Area / street"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {fallbackPincodes.length > 1 ? (
                <select className="select" value={manualPin} onChange={(e) => setManualPin(e.target.value)} aria-label="Delivery pincode">
                  {fallbackPincodes.map((p) => <option key={p} value={p}>{fallbackCity} {p}</option>)}
                </select>
              ) : (
                <input
                  className="input"
                  inputMode="numeric"
                  placeholder="6-digit pincode"
                  value={manualPin}
                  onChange={(e) => setManualPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              )}
              <button
                type="button"
                className="btn btn--out btn--sm"
                onClick={() =>
                  setPlace({
                    placeId: null,
                    fullAddress: query.trim() || fallbackCity,
                    latitude: null,
                    longitude: null,
                    pincode: manualPin,
                    city: fallbackCity,
                    state: "",
                  })
                }
              >
                Continue
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="addrf__picked">
            <IconPin />
            <span>
              <b>{place.fullAddress}</b>
              <small>{[place.city, place.pincode].filter(Boolean).join(" · ")}</small>
            </span>
            <button type="button" onClick={() => { setPlace(null); setVerdict(null); setQuery(""); }}>Change</button>
          </div>

          {verdict ? (
            <p className={`addrf__verdict${verdict.deliverable ? "" : " is-bad"}`}>
              {verdict.deliverable
                ? `Delivers here${verdict.distanceKm != null ? ` · ${verdict.distanceKm.toFixed(1)} km` : ""}${verdict.fee > 0 ? ` · ₹${verdict.fee} delivery` : " · free delivery"}`
                : verdict.reason}
            </p>
          ) : null}

          <div className="co5__grid" style={{ marginTop: 12 }}>
            <input
              className="input"
              placeholder="Flat / house / building no."
              value={houseNo}
              onChange={(e) => setHouseNo(e.target.value)}
            />
            <input
              className="input"
              placeholder="Landmark (optional)"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {LABELS.map((l) => (
              <button type="button" key={l} className="chip chip--sm" aria-pressed={label === l} onClick={() => setLabel(l)}>{l}</button>
            ))}
          </div>
        </>
      )}

      {error ? <p className="addrf__err">{error}</p> : null}

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button type="button" className="btn btn--rose btn--sm" disabled={busy || !place} onClick={save}>
          {busy ? "Saving…" : initial ? "Update address" : "Save address"}
        </button>
        <button type="button" className="btn btn--out btn--sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
