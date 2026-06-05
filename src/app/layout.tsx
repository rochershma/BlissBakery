import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LoginModal } from "@/components/auth/login-modal";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav";
import { ToastProvider } from "@/components/shared/toast";
import { ConfirmProvider } from "@/components/shared/confirm-dialog";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bliss Bakery",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#D4A0A0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              {children}
              <LoginModal />
              <WhatsAppButton />
              <MobileBottomNav />
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
