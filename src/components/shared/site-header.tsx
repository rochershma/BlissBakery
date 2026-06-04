"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useCartStore } from "@/store/cart";
import { SearchOverlay } from "./search-overlay";
import {
  ShoppingBag,
  Search,
  User,
  LogOut,
  Package,
  MapPin,
  Heart,
  Settings,
  Shield,
  ChevronRight,
  ChevronDown,
  X,
  Navigation,
  Loader2,
} from "lucide-react";
import Image from "next/image";

const POPULAR_SEARCHES = ["Chocolate Truffle", "Birthday Cake", "Pastries", "Brownies", "KitKat Cake", "Custom Cake"];

export function SiteHeader() {
  const { user, loading, setShowLoginModal, logout } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationText, setLocationText] = useState("Kuchaman City");
  const [locating, setLocating] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => setHydrated(true), []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    if (showProfile || searchFocused) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfile, searchFocused]);

  const items = useCartStore((s) => s.items);
  const itemCount = hydrated ? items.reduce((s, i) => s + i.quantity, 0) : 0;

  // Detect location via geolocation API
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address;
            const city = addr.city || addr.town || addr.village || addr.county || "Kuchaman City";
            setLocationText(city);
          }
        } catch {
          setLocationText("Kuchaman City");
        }
        setLocating(false);
      },
      () => { setLocating(false); },
      { timeout: 8000 }
    );
  }, []);

  const handleSearchSubmit = (q: string) => {
    if (q.trim().length > 0) {
      setSearchFocused(false);
      setSearchQuery("");
      setShowSearch(true);
    }
  };

  return (
    <>
    <header className="sticky top-0 z-50 glass-header border-b border-border/60">
      <div className="max-w-[1300px] mx-auto px-4 md:px-5">
        <div className="flex items-center gap-3 md:gap-5 h-[64px] md:h-[72px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl overflow-hidden relative bg-white shadow-sm p-1">
              <Image src="/uploads/branding/logo.png" alt="Bliss Bakery" fill className="object-cover scale-110" sizes="44px" priority />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm md:text-base font-bold text-foreground leading-none font-serif tracking-tight">Bliss Bakery</h1>
              <p className="text-[9px] md:text-[10px] text-primary font-semibold mt-0.5">100% Veg & Eggless</p>
            </div>
          </Link>

          {/* Location Picker */}
          <button
            onClick={detectLocation}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-border bg-white/80 hover:bg-white hover:border-primary/30 transition-all text-sm max-w-[200px] flex-shrink-0"
          >
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="truncate text-foreground font-medium text-xs">
              {locating ? "Detecting..." : locationText}
            </span>
            {locating ? (
              <Loader2 className="w-3 h-3 text-primary animate-spin flex-shrink-0" />
            ) : (
              <Navigation className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </button>

          {/* Search Bar — Desktop inline, Mobile icon */}
          <div ref={searchRef} className="flex-1 relative hidden md:block max-w-[480px]">
            <div className={`flex items-center border rounded-2xl bg-white/80 transition-all ${searchFocused ? "border-primary shadow-md ring-2 ring-primary/10" : "border-border"}`}>
              <Search className="w-4 h-4 text-muted-foreground ml-3.5 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search for cakes, pastries, brownies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(searchQuery); }}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-1.5 mr-1 rounded-full hover:bg-muted">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Search Suggestions Dropdown */}
            {searchFocused && !searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-2xl shadow-xl p-3 z-50">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 px-1">Popular searches</p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => { setSearchQuery(term); handleSearchSubmit(term); }}
                      className="px-3 py-1.5 rounded-full bg-surface-blush text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border/50"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile search button */}
          <button
            onClick={() => setShowSearch(true)}
            className="md:hidden p-2.5 rounded-2xl hover:bg-primary-light transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-foreground" />
          </button>

          {/* Right side actions */}
          <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-2xl hover:bg-primary-light transition-colors group"
            >
              <ShoppingBag className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
              {hydrated && itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
              <span className="hidden lg:block text-[10px] text-muted-foreground font-medium mt-0.5">Cart</span>
            </Link>

            {/* Profile / Login */}
            <div className="relative" ref={profileRef}>
              {loading ? (
                <div className="w-9 h-9 rounded-2xl bg-muted animate-pulse" />
              ) : user ? (
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-1.5 p-2 md:px-3 md:py-2 rounded-2xl hover:bg-primary-light transition-colors group"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {(user.name || user.phone)[0].toUpperCase()}
                  </div>
                  <span className="hidden lg:block text-xs font-medium text-foreground group-hover:text-primary">{(user.name || "Account").split(" ")[0]}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground hidden lg:block" />
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-semibold text-foreground hover:bg-primary-light transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline text-xs">Sign In</span>
                </button>
              )}

              {/* Profile Dropdown */}
              {showProfile && user && (
                <>
                  <div className="fixed inset-0 bg-black/30 z-[60]" onClick={() => setShowProfile(false)} />
                  <div className="fixed inset-x-0 bottom-0 max-h-[80vh] bg-white shadow-2xl z-[70] rounded-t-2xl md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-72 md:rounded-2xl md:border md:border-border md:shadow-xl md:max-h-none overflow-y-auto">
                    <button onClick={() => setShowProfile(false)} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted">
                      <X className="w-5 h-5" />
                    </button>

                  {/* User Info */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {(user.name || user.phone)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{user.name || "User"}</p>
                        <p className="text-xs text-muted-foreground">+91 {user.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <nav className="p-2">
                    <Link
                      href="/profile"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      Personal Information
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Package className="w-4 h-4 text-muted-foreground" />
                      My Orders
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </Link>
                    <Link
                      href="/addresses"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Manage Addresses
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </Link>
                    <Link
                      href="/offers"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Heart className="w-4 h-4 text-muted-foreground" />
                      Offers
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </Link>

                    {/* Admin/Staff link */}
                    {(user.role === "ADMIN" || user.role === "STAFF") && (
                      <Link
                        href="/admin"
                        onClick={() => setShowProfile(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-primary font-medium hover:bg-primary/5 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Panel
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </Link>
                    )}
                  </nav>

                  {/* Logout */}
                  <div className="p-2 border-t border-border">
                    <button
                      onClick={() => {
                        logout();
                        setShowProfile(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-red-50 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>

                  {/* Powered By */}
                  <div className="p-3 border-t border-border text-center">
                    <p className="text-[10px] text-muted-foreground">Powered by Bliss Bakery</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        </div>
      </div>
    </header>

    {/* Search Overlay */}
    {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
    </>
  );
}
