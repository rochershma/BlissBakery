"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import {
  ShoppingBag, Search, User, LogOut, Package, MapPin, Heart,
  Shield, ChevronRight, ChevronDown, X, Loader2,
} from "lucide-react";

const POPULAR_SEARCHES = ["Chocolate Truffle", "Birthday Cake", "Pastries", "Brownies", "KitKat Cake", "Custom Cake"];

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  image: string | null;
  categoryName: string;
}

export function SiteHeader() {
  const router = useRouter();
  const { user, loading, setShowLoginModal, logout } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => setHydrated(true), []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const items = useCartStore((s) => s.items);
  const itemCount = hydrated ? items.reduce((s, i) => s + i.quantity, 0) : 0;

  // Real-time search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch { /* ignore */ }
    setSearchLoading(false);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(val), 300);
  };

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const navigateToProduct = (slug: string) => {
    closeSearch();
    router.push(`/store/kuchaman-city/menu/${slug}`);
  };

  const handlePopularClick = (term: string) => {
    setSearchQuery(term);
    doSearch(term);
  };

  return (
    <header className="sticky top-0 z-50 glass-header border-b border-border/60">
      <div className="max-w-[1300px] mx-auto px-4 md:px-5">
        <div className="flex items-center h-[56px] md:h-[66px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-3 md:mr-5">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden relative bg-white shadow-sm flex-shrink-0">
              <Image src="/uploads/branding/logo.png" alt="Bliss Bakery" fill className="object-cover scale-125" sizes="40px" priority />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm md:text-[15px] font-bold text-foreground leading-none font-serif tracking-tight">Bliss Bakery</span>
              <span className="block text-[9px] text-primary font-semibold mt-0.5">100% Veg & Eggless</span>
            </div>
          </Link>

          {/* Location — simple display */}
          <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/60 bg-white/60 mr-3 flex-shrink-0">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">Kuchaman City</span>
          </div>

          {/* Search Bar — Desktop: inline, Mobile: expandable */}
          <div ref={searchRef} className="flex-1 relative">
            {/* Desktop search bar (always visible) */}
            <div className="hidden md:block">
              <div className={`flex items-center border rounded-xl transition-all ${searchOpen ? "border-primary ring-1 ring-primary/20 bg-white" : "border-border/60 bg-white/60 hover:bg-white hover:border-border"}`}>
                <Search className="w-4 h-4 text-muted-foreground ml-3 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search cakes, pastries, brownies..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  className="flex-1 bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="p-1 mr-2 rounded-full hover:bg-muted">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Search dropdown */}
              {searchOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-border rounded-xl shadow-xl z-50 max-h-[400px] overflow-y-auto">
                  {searchQuery.length < 2 ? (
                    /* Popular searches */
                    <div className="p-3">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Popular searches</p>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SEARCHES.map((term) => (
                          <button key={term} onClick={() => handlePopularClick(term)}
                            className="px-3 py-1.5 rounded-full bg-surface-blush text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border/40">
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : searchLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-1">
                      {searchResults.map((r) => (
                        <button key={r.id} onClick={() => navigateToProduct(r.slug)}
                          className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-muted/50 transition-colors text-left">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                            {r.image && <Image src={r.image} alt={r.name} fill className="object-cover" sizes="48px" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.categoryName} · {formatPrice(r.basePrice)}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">No products found for &ldquo;{searchQuery}&rdquo;</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile search button */}
            <div className="md:hidden flex-1 flex justify-end">
              <button onClick={openSearch} className="p-2 rounded-xl hover:bg-muted transition-colors" aria-label="Search">
                <Search className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 md:gap-1 ml-1 md:ml-3 flex-shrink-0">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 rounded-xl hover:bg-muted transition-colors">
              <ShoppingBag className="w-5 h-5 text-foreground" />
              {hydrated && itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <div className="relative" ref={profileRef}>
              {loading ? (
                <div className="w-8 h-8 rounded-xl bg-muted animate-pulse" />
              ) : user ? (
                <button onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-1 p-2 rounded-xl hover:bg-muted transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                    {(user.name || user.phone)[0].toUpperCase()}
                  </div>
                  <ChevronDown className="w-3 h-3 text-muted-foreground hidden md:block" />
                </button>
              ) : (
                <button onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-1.5 p-2 md:px-3 md:py-2 rounded-xl hover:bg-muted transition-colors">
                  <User className="w-5 h-5 text-foreground" />
                  <span className="hidden md:inline text-xs font-semibold text-foreground">Sign In</span>
                </button>
              )}

              {/* Profile Dropdown */}
              {showProfile && user && (
                <>
                  <div className="fixed inset-0 bg-black/30 z-[60]" onClick={() => setShowProfile(false)} />
                  <div className="fixed inset-x-0 bottom-0 max-h-[80vh] bg-white shadow-2xl z-[70] rounded-t-2xl md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-72 md:rounded-xl md:border md:border-border md:shadow-xl md:max-h-none overflow-y-auto">
                    <button onClick={() => setShowProfile(false)} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted z-10">
                      <X className="w-5 h-5" />
                    </button>
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {(user.name || user.phone)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{user.name || "User"}</p>
                          <p className="text-xs text-muted-foreground">+91 {user.phone}</p>
                        </div>
                      </div>
                    </div>
                    <nav className="p-1.5">
                      {[
                        { href: "/profile", icon: User, label: "Profile" },
                        { href: "/orders", icon: Package, label: "My Orders" },
                        { href: "/addresses", icon: MapPin, label: "Addresses" },
                        { href: "/offers", icon: Heart, label: "Offers" },
                      ].map(({ href, icon: Icon, label }) => (
                        <Link key={href} href={href} onClick={() => setShowProfile(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          {label}
                          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                        </Link>
                      ))}
                      {(user.role === "ADMIN" || user.role === "STAFF") && (
                        <Link href="/admin" onClick={() => setShowProfile(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-primary font-medium hover:bg-primary/5 transition-colors">
                          <Shield className="w-4 h-4" />
                          Admin Panel
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </Link>
                      )}
                    </nav>
                    <div className="p-1.5 border-t border-border">
                      <button onClick={() => { logout(); setShowProfile(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-red-50 transition-colors w-full">
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Mobile full-screen search */}
      {searchOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-[80] flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <button onClick={closeSearch} className="p-1 rounded-lg hover:bg-muted">
              <X className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1 flex items-center border border-border rounded-xl bg-muted/30 px-3">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search cakes, pastries..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1 bg-transparent px-2 py-2.5 text-sm text-foreground outline-none"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {searchQuery.length < 2 ? (
              <div className="p-4">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-3">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button key={term} onClick={() => handlePopularClick(term)}
                      className="px-3 py-2 rounded-full bg-surface-blush text-xs font-medium text-foreground border border-border/40">
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                {searchResults.map((r) => (
                  <button key={r.id} onClick={() => navigateToProduct(r.slug)}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/30">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                      {r.image && <Image src={r.image} alt={r.name} fill className="object-cover" sizes="56px" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.categoryName} · {formatPrice(r.basePrice)}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No results for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
