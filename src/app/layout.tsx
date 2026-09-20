import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
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

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Bliss Bakery | 100% Vegetarian & Eggless",
    template: "%s | Bliss Bakery",
  },
  description:
    "Order fresh cakes, pastries, brownies & more from Bliss Bakery, Kuchaman City. 100% vegetarian & eggless. Pickup or delivery.",
  keywords: [
    "bakery",
    "eggless cakes",
    "vegetarian bakery",
    "Kuchaman City",
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
      className={`${jakarta.variable} ${inter.variable} h-full antialiased`}
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
