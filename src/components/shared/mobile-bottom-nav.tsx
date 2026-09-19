"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Search, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useSearch } from "@/components/shared/search-context";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/store/kuchaman-city/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "#search", label: "Search", icon: Search, isSearch: true },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/profile", label: "Account", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openSearch } = useSearch();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const cartItems = useCartStore((s) => s.items);
  const cartCount = hydrated ? cartItems.reduce((s, i) => s + i.quantity, 0) : 0;

  // Don't show on admin, cart, checkout, or product detail pages
  if (pathname.startsWith("/admin") || pathname === "/cart" || pathname === "/checkout") return null;
  // Hide on product detail pages (they have sticky CTA)
  const isProductPage = /^\/store\/[^/]+\/menu\/[^/]+$/.test(pathname);
  if (isProductPage) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[80] bg-white border-t border-pink-100/80 shadow-[0_-4px_20px_-4px_rgba(196,117,144,0.08)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="grid grid-cols-5 items-center h-[56px]">
        {navItems.map((item) => {
          const isActive = !('isSearch' in item) && (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));
          const isCart = item.label === "Cart";
          const isSearchItem = 'isSearch' in item && item.isSearch;

          if (isSearchItem) {
            return (
              <button
                key="search"
                onClick={openSearch}
                className="flex flex-col items-center justify-center gap-[3px] py-1 transition-colors relative text-muted-foreground active:scale-95"
                aria-label="Search"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <Search className="w-[22px] h-[22px]" />
                </div>
                <span className="text-[9px] font-semibold leading-none tracking-tight">Search</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-[3px] py-1 transition-all relative active:scale-95 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label={item.label}
            >
              <div className="relative">
                <div className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                  <item.icon className={`w-[22px] h-[22px] transition-colors ${isActive ? "text-primary" : ""}`} />
                </div>
                {isCart && hydrated && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none shadow-sm">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-semibold leading-none tracking-tight ${isActive ? "text-primary" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
