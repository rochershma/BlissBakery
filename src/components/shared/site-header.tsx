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
  Shield, ChevronRight, ChevronDown, X, Loader2, Store, Check,
} from "lucide-react";

const POPULAR_SEARCHES = ["Chocolate Truffle", "Birthday Cake", "Pastries", "Brownies", "KitKat Cake"];

const STORES = [
  { slug: "kuchaman-city", name: "Kuchaman City", address: "Main Market, Kuchaman City, Rajasthan", available: true },
  { slug: "jaipur", name: "Jaipur", address: "Coming soon", available: false },
  { slug: "jodhpur", name: "Jodhpur", address: "Coming soon", available: false },
];

interface SearchResult {
  id: string; name: string; slug: string; basePrice: number; image: string | null; categoryName: string;
}

export function SiteHeader() {
  const router = useRouter();
  const { user, loading, setShowLoginModal, logout } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState("kuchaman-city");

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => setHydrated(true), []);

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
  const currentStore = STORES.find((s) => s.slug === selectedStore) || STORES[0];

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) { const data = await res.json(); setSearchResults(data.results || []); }
    } catch { /* ignore */ }
    setSearchLoading(false);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(val), 300);
  };

  const openSearch = () => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); };
  const closeSearch = () => { setSearchOpen(false); setSearchQuery(""); setSearchResults([]); };

  const navigateToSearch = (q: string) => {
    if (q.trim().length > 0) {
      closeSearch();
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const navigateToProduct = (slug: string) => {
    closeSearch();
    router.push(`/store/kuchaman-city/menu/${slug}`);
  };

  return (
    <>
    <header className="sticky top-0 z-50 glass-header border-b border-border/60">
      <div className="max-w-[1300px] mx-auto px-4 md:px-5">
        <div className="flex items-center h-[56px] md:h-[64px]">

          {/* Left: Logo + Store */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl overflow-hidden relative bg-white shadow-sm flex-shrink-0">
                <Image src="/uploads/branding/logo.png" alt="Bliss Bakery" fill className="object-cover scale-125" sizes="36px" priority />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-bold text-foreground leading-none font-serif tracking-tight">Bliss Bakery</span>
                <span className="block text-[9px] text-primary font-semibold mt-0.5">100% Veg & Eggless</span>
              </div>
            </Link>

            {/* Store Selector */}
            <button
              onClick={() => setShowStoreModal(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-white/80 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div className="text-left hidden md:block">
                <span className="block text-[10px] text-muted-foreground leading-none">Delivering to</span>
                <span className="block text-xs font-semibold text-foreground leading-tight">{currentStore.name}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>

          {/* Center: Search — Desktop inline */}
          <div ref={searchRef} className="flex-1 flex justify-center mx-3 hidden md:flex">
            <div className="relative w-full max-w-[380px]">
              <div className={`flex items-center border rounded-lg transition-all h-9 ${searchOpen ? "border-primary ring-1 ring-primary/15 bg-white" : "border-border/50 bg-white/50 hover:bg-white"}`}>
                <Search className="w-3.5 h-3.5 text-muted-foreground ml-2.5 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search cakes, pastries..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setSearchOpen(true)}                onKeyDown={(e) => { if (e.key === "Enter") navigateToSearch(searchQuery); }}                  className="flex-1 bg-transparent px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="p-1 mr-1 rounded hover:bg-muted">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>

            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-xl z-50 max-h-[380px] overflow-y-auto">
                {searchQuery.length < 2 ? (
                  <div className="p-3">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Popular</p>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SEARCHES.map((t) => (
                        <button key={t} onClick={() => { navigateToSearch(t); }}
                          className="px-2.5 py-1 rounded-full bg-surface-blush text-[11px] font-medium text-foreground hover:bg-primary/10 transition-colors border border-border/30">
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : searchLoading ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 text-primary animate-spin" /></div>
                ) : searchResults.length > 0 ? (
                  <div className="py-1">
                    {searchResults.map((r) => (
                      <button key={r.id} onClick={() => navigateToProduct(r.slug)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-muted/50 transition-colors text-left">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                          {r.image && <Image src={r.image} alt={r.name} fill className="object-cover" sizes="40px" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{r.name}</p>
                          <p className="text-[11px] text-muted-foreground">{r.categoryName} · {formatPrice(r.basePrice)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center"><p className="text-xs text-muted-foreground">No results for &ldquo;{searchQuery}&rdquo;</p></div>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Right: Mobile search + Cart + Account */}
          <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
            <button onClick={openSearch} className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Search">
              <Search className="w-5 h-5 text-foreground" />
            </button>

            <Link href="/cart" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <ShoppingBag className="w-5 h-5 text-foreground" />
            {hydrated && itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {/* Account */}
          <div className="relative flex-shrink-0" ref={profileRef}>
            {loading ? (
              <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
            ) : user ? (
              <button onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-muted transition-colors">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px]">
                  {(user.name || user.phone)[0].toUpperCase()}
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground hidden md:block" />
              </button>
            ) : (
              <button onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors">
                <User className="w-5 h-5 text-foreground" />
                <span className="hidden md:inline text-xs font-semibold">Sign In</span>
              </button>
            )}

            {showProfile && user && (
              <>
                <div className="fixed inset-0 bg-black/30 z-[60]" onClick={() => setShowProfile(false)} />
                <div className="fixed inset-x-0 bottom-0 max-h-[80vh] bg-white shadow-2xl z-[70] rounded-t-2xl md:absolute md:inset-auto md:right-0 md:top-full md:mt-1.5 md:w-64 md:rounded-xl md:border md:border-border md:shadow-xl md:max-h-none overflow-y-auto">
                  <button onClick={() => setShowProfile(false)} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted z-10"><X className="w-4 h-4" /></button>
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">{(user.name || user.phone)[0].toUpperCase()}</div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{user.name || "User"}</p>
                        <p className="text-[11px] text-muted-foreground">+91 {user.phone}</p>
                      </div>
                    </div>
                  </div>
                  <nav className="p-1">
                    {[
                      { href: "/profile", icon: User, label: "Profile" },
                      { href: "/orders", icon: Package, label: "My Orders" },
                      { href: "/addresses", icon: MapPin, label: "Addresses" },
                      { href: "/offers", icon: Heart, label: "Offers" },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link key={href} href={href} onClick={() => setShowProfile(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                        <Icon className="w-4 h-4 text-muted-foreground" />{label}
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                      </Link>
                    ))}
                    {(user.role === "ADMIN" || user.role === "STAFF") && (
                      <Link href="/admin" onClick={() => setShowProfile(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-primary font-medium hover:bg-primary/5 transition-colors">
                        <Shield className="w-4 h-4" />Admin Panel<ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </Link>
                    )}
                  </nav>
                  <div className="p-1 border-t border-border">
                    <button onClick={() => { logout(); setShowProfile(false); }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-red-50 transition-colors w-full">
                      <LogOut className="w-4 h-4" />Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      </div>
    </header>

    {/* Store Selector Modal */}
    {showStoreModal && (
      <>
        <div className="fixed inset-0 bg-black/40 z-[80]" onClick={() => setShowStoreModal(false)} />
        <div className="fixed inset-x-4 top-[50%] -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] bg-white rounded-2xl shadow-2xl z-[81] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h3 className="font-serif font-bold text-base text-foreground">Select Store</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Choose your nearest Bliss Bakery outlet</p>
            </div>
            <button onClick={() => setShowStoreModal(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-3 space-y-2">
            {STORES.map((store) => (
              <button
                key={store.slug}
                disabled={!store.available}
                onClick={() => { if (store.available) { setSelectedStore(store.slug); setShowStoreModal(false); } }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  store.available
                    ? selectedStore === store.slug
                      ? "bg-primary/5 border-2 border-primary"
                      : "bg-white border border-border hover:border-primary/40 hover:bg-muted/30"
                    : "bg-muted/30 border border-border/50 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selectedStore === store.slug && store.available ? "bg-primary text-white" : "bg-surface-blush text-primary"
                }`}>
                  <Store className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{store.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{store.address}</p>
                </div>
                {selectedStore === store.slug && store.available && (
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                )}
                {!store.available && (
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex-shrink-0">Soon</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </>
    )}

    {/* Mobile full-screen search */}
    {searchOpen && (
      <div className="md:hidden fixed inset-0 bg-white z-[80] flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
          <button onClick={closeSearch} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
          <div className="flex-1 flex items-center border border-border rounded-lg bg-muted/20 px-2.5 h-9">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input autoFocus placeholder="Search cakes, pastries..." value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none" />
            {searchQuery && <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}><X className="w-4 h-4 text-muted-foreground" /></button>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {searchQuery.length < 2 ? (
            <div className="p-4">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2.5">Popular</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((t) => (
                  <button key={t} onClick={() => { navigateToSearch(t); }}
                    className="px-3 py-1.5 rounded-full bg-surface-blush text-xs font-medium border border-border/30">{t}</button>
                ))}
              </div>
            </div>
          ) : searchLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
          ) : searchResults.length > 0 ? (
            searchResults.map((r) => (
              <button key={r.id} onClick={() => navigateToProduct(r.slug)}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 text-left border-b border-border/20">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                  {r.image && <Image src={r.image} alt={r.name} fill className="object-cover" sizes="48px" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.categoryName} · {formatPrice(r.basePrice)}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="py-10 text-center"><p className="text-sm text-muted-foreground">No results</p></div>
          )}
        </div>
      </div>
    )}
    </>
  );
}

