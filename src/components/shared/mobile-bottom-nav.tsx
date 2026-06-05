"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Search, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/store/kuchaman-city/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/search", label: "Search", icon: Search },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/profile", label: "Account", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const cartItems = useCartStore((s) => s.items);
  const cartCount = hydrated ? cartItems.reduce((s, i) => s + i.quantity, 0) : 0;

  // Don't show on admin, cart, or checkout pages
  if (pathname.startsWith("/admin") || pathname === "/cart" || pathname === "/checkout") return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[80] bg-white/95 backdrop-blur-md border-t border-border" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="grid grid-cols-5 items-center h-[60px]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const isCart = item.label === "Cart";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 transition-colors relative min-h-[44px] ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label={item.label}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                {isCart && hydrated && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none ${isActive ? "text-primary" : ""}`}>
                {item.label}
              </span>
              {isActive && <div className="absolute -bottom-0.5 w-5 h-[2px] bg-primary rounded-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
