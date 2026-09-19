"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem("pwa-install-dismissed")) {
      setDismissed(true);
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
      // Show after a delay so it doesn't appear immediately
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setVisible(false);
      setPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Hide on checkout/cart
  if (pathname === "/checkout" || pathname === "/cart") return null;
  if (!visible || !prompt || dismissed) return null;

  return (
    <div className="fixed left-3 right-3 z-[75] animate-slide-up md:left-auto md:right-4 md:w-[340px]" style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>
      <div className="bg-white rounded-2xl border border-border shadow-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground">Install Bliss Bakery</p>
          <p className="text-xs text-muted-foreground mt-0.5">Order cakes faster from your home screen</p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={async () => {
                prompt.prompt();
                const result = await prompt.userChoice;
                if (result.outcome === "accepted") {
                  setVisible(false);
                }
                setPrompt(null);
              }}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors min-h-[36px]"
            >
              Install
            </button>
            <button
              onClick={() => {
                setVisible(false);
                setDismissed(true);
                sessionStorage.setItem("pwa-install-dismissed", "1");
              }}
              className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[36px]"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setDismissed(true);
            sessionStorage.setItem("pwa-install-dismissed", "1");
          }}
          className="p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0"
          aria-label="Close install prompt"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
