import { SiteHeader } from "@/components/shared/site-header";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-8 page-enter">
        <h1 className="text-2xl font-bold text-foreground mb-6 font-serif">Privacy Policy</h1>
        <div className="bg-white rounded-2xl border border-border p-6 prose prose-sm max-w-none text-foreground/80 space-y-4">
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          <p>Bliss Bakery (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services.</p>

          <h2 className="text-lg font-bold text-foreground">1. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Personal Data:</strong> Name, phone number, email address (optional), delivery addresses</li>
            <li><strong>Order Data:</strong> Order history, payment information (processed by Razorpay), preferences</li>
            <li><strong>Usage Data:</strong> Pages visited, device type, browser, IP address (collected automatically)</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To process and fulfill your orders</li>
            <li>To send order status updates via WhatsApp/SMS</li>
            <li>To send promotional offers (with your consent)</li>
            <li>To improve our products and services</li>
            <li>To comply with legal obligations</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground">3. Data Sharing</h2>
          <p>We do not sell your personal data. We share data only with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Razorpay:</strong> Payment processing</li>
            <li><strong>WhatsApp Business API:</strong> Order notifications</li>
            <li><strong>SMS Gateway:</strong> OTP verification</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground">4. Data Security</h2>
          <p>We implement appropriate security measures including HTTPS encryption, secure authentication, and restricted access to protect your data.</p>

          <h2 className="text-lg font-bold text-foreground">5. Your Rights</h2>
          <p>Under the Digital Personal Data Protection Act, 2023, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access your personal information</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Withdraw consent for marketing communications</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground">6. Contact Us</h2>
          <p>For any privacy-related queries, contact us at:</p>
          <p>Email: <a href="mailto:hello@blissbakery.in" className="text-primary">hello@blissbakery.in</a><br />
          Phone: <a href="tel:9602831559" className="text-primary">+91 9602831559</a><br />
          Address: Main Market, Kuchaman City, Rajasthan</p>
        </div>
      </main>
    </div>
  );
}
