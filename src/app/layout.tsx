import type { Metadata, Viewport } from "next";
import { Fraunces, Archivo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LoginModal } from "@/components/auth/login-modal";
import { MobileNavV5 } from "@/components/v5/site-header";
import { InstallAppPrompt } from "@/components/shared/install-prompt";
import { ToastProvider } from "@/components/shared/toast";
import { ConfirmProvider } from "@/components/shared/confirm-dialog";
import { ServiceWorkerRegistration } from "@/components/shared/sw-register";
import { SearchProvider } from "@/components/shared/search-context";
import { MobileSearchOverlayWrapper } from "@/components/shared/mobile-search-wrapper";
import { StoreGate } from "@/components/v5/store-gate";
import { getCustomerStoreSlug } from "@/lib/customer-store";

// Fraunces carries the printed, hand-cut voice; the soft/wonk axes are what
// stop a headline reading as a stock serif. Archivo is the workhorse.
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const text = Archivo({
  variable: "--font-text",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bliss Bakery | 100% Vegetarian & Eggless",
    template: "%s | Bliss Bakery",
  },
  description:
    "Order fresh cakes, pastries, brownies & more from Bliss Bakery in Kuchaman City and Kishangarh. 100% vegetarian & eggless. Pickup or delivery.",
  keywords: [
    "bakery",
    "eggless cakes",
    "vegetarian bakery",
    "Kuchaman City",
    "Kishangarh",
    "custom cakes",
    "online order",
    "Bliss Bakery",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bliss Bakery",
  },
  // src/app/icon.png and apple-icon.png are picked up automatically;
  // these entries add the sizes browsers prefer for tabs and bookmarks.
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#af3f63",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chosenStore = await getCustomerStoreSlug();

  return (
    <html
      lang="en"
        className={`${display.variable} ${text.variable} h-full antialiased`}
      // Browser extensions inject attributes on <html> before hydration.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <AuthProvider>
          <SearchProvider>
          <ToastProvider>
            <ConfirmProvider>
              {children}
              <StoreGate chosen={chosenStore} />
              <LoginModal />
              <MobileNavV5 />
              <MobileSearchOverlayWrapper />
              <InstallAppPrompt />
              <ServiceWorkerRegistration />
            </ConfirmProvider>
          </ToastProvider>
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
