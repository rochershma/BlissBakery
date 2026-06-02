"use client";

import { useState, useEffect, useRef } from "react";
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
  X,
} from "lucide-react";
import Image from "next/image";

export function SiteHeader() {
  const { user, loading, setShowLoginModal, logout } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => setHydrated(true), []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    if (showProfile) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfile]);

  const items = useCartStore((s) => s.items);
  const itemCount = hydrated ? items.reduce((s, i) => s + i.quantity, 0) : 0;

  return (
    <>
    <header className="sticky top-0 z-50 glass-header border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        {/* Logo — always routes to home */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden flex-shrink-0 relative">
            <Image src="/uploads/branding/logo.png" alt="Bliss Bakery" fill className="object-cover scale-125" sizes="48px" priority />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-foreground leading-tight font-serif tracking-tight">Bliss Bakery</h1>
            <p className="text-[10px] md:text-xs text-primary font-medium tracking-wide">100% Veg &amp; Eggless</p>
          </div>
        </Link>

        {/* Right side: Search + Cart + Profile */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 rounded-full hover:bg-primary-light transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-foreground" />
          </button>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative p-2 rounded-full hover:bg-primary-light transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-foreground" />
            {hydrated && itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {/* Profile / Login */}
          <div className="relative" ref={profileRef}>
            {loading ? (
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
              >
                {(user.name || user.phone)[0].toUpperCase()}
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-primary hover:bg-primary-light transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {/* Profile Dropdown / Sidebar */}
            {showProfile && user && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 bg-black/30 z-[60]" onClick={() => setShowProfile(false)} />
                {/* Panel — bottom sheet on mobile, dropdown on desktop */}
                <div className="fixed inset-x-0 bottom-0 max-h-[80vh] bg-white shadow-2xl z-[70] rounded-t-2xl md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-64 md:rounded-2xl md:border md:border-border md:shadow-xl md:max-h-none animate-in slide-in-from-bottom md:slide-in-from-top-2 duration-200 overflow-y-auto">
                  {/* Close button */}
                  <button
                    onClick={() => setShowProfile(false)}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted"
                  >
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
    </header>

    {/* Search Overlay */}
    {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
    </>
  );
}
