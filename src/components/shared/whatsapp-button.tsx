"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/919602831559?text=Hi%20Bliss%20Bakery!%20I'd%20like%20to%20place%20an%20order."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[72px] md:bottom-5 right-5 z-[90] w-11 h-11 md:w-13 md:h-13 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/25 hover:scale-110 transition-all duration-300"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
    </a>
  );
}
