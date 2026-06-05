"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

export function WhatsAppButton() {
  const pathname = usePathname();
  // Hide on cart, checkout, and admin pages
  if (pathname === "/cart" || pathname === "/checkout" || pathname.startsWith("/admin")) return null;

  return (
    <a
      href="https://wa.me/919602831559?text=Hi%20Bliss%20Bakery!%20I'd%20like%20to%20place%20an%20order."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 z-[75] w-12 h-12 md:w-13 md:h-13 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/25 hover:scale-110 transition-all duration-300"
      style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
    </a>
  );
}
