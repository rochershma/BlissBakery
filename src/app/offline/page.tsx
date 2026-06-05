"use client";

import { WifiOff, Phone, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <WifiOff className="w-8 h-8 text-primary" />
      </div>

      <h1 className="text-2xl font-serif font-bold text-foreground mb-2">You&apos;re offline</h1>
      <p className="text-sm text-muted-foreground max-w-xs mb-8">
        Your menu and cart will refresh when internet returns.
      </p>

      <a
        href="tel:9602831559"
        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm mb-4 min-h-[48px]"
      >
        <Phone className="w-4 h-4" />
        Call Bliss Bakery: 9602831559
      </a>

      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 text-sm text-primary font-medium hover:underline min-h-[44px]"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
}
