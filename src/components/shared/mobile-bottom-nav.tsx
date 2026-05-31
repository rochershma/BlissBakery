"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/store/kuchaman-city/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/profile", label: "Account", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const cartCount = hydrated ? useCartStore.getState().getItemCount() : 0;

  // Don't show on admin, cart, or checkout pages
  if (pathname.startsWith("/admin") || pathname === "/cart" || pathname === "/checkout") return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[80] bg-white/95 backdrop-blur-sm border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-1.5 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const isCart = item.label === "Cart";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors relative ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                {isCart && hydrated && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : ""}`}>
                {item.label}
              </span>
              {isActive && <div className="absolute -bottom-1.5 w-1 h-1 bg-primary rounded-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
