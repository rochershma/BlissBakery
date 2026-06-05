import { SiteHeader } from "@/components/shared/site-header";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-8 page-enter">
        <h1 className="text-2xl font-bold text-foreground mb-6 font-serif">Terms &amp; Conditions</h1>
        <div className="bg-white rounded-2xl border border-border p-6 prose prose-sm max-w-none text-foreground/80 space-y-4">
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          <p>By using the Bliss Bakery website and services, you agree to the following terms and conditions.</p>

          <h2 className="text-lg font-bold text-foreground">1. General</h2>
          <p>Bliss Bakery is a 100% vegetarian and eggless bakery based in Kuchaman City, Rajasthan. All products listed on our website are vegetarian and made without eggs.</p>

          <h2 className="text-lg font-bold text-foreground">2. Orders</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>All orders are subject to availability</li>
            <li>Prices are inclusive of applicable taxes unless stated otherwise</li>
            <li>We reserve the right to refuse or cancel orders for any reason</li>
            <li>Custom cake orders require advance notice and are subject to consultation</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground">3. Payments</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>All payments are processed securely through Razorpay</li>
            <li>We accept UPI, credit/debit cards, net banking, and digital wallets</li>
            <li>Bliss Bakery does not store any payment card information</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground">4. Delivery &amp; Pickup</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Delivery is available within Kuchaman City limits</li>
            <li>Delivery charges may apply based on distance and order value</li>
            <li>Pickup orders can be collected from our store during operating hours</li>
            <li>Estimated delivery/pickup times are approximate and not guaranteed</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground">5. Cancellation</h2>
          <p>Once an order is placed and confirmed, it <strong>cannot be cancelled</strong>. We begin preparation immediately upon confirmation.</p>

          <h2 className="text-lg font-bold text-foreground">6. Liability</h2>
          <p>While we take utmost care in preparation and delivery, Bliss Bakery shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>

          <h2 className="text-lg font-bold text-foreground">7. Intellectual Property</h2>
          <p>All content on this website including logos, images, and text is the property of Bliss Bakery and may not be reproduced without permission.</p>

          <h2 className="text-lg font-bold text-foreground">8. Contact</h2>
          <p>For any queries regarding these terms, contact us at <a href="mailto:hello@blissbakery.in" className="text-primary">hello@blissbakery.in</a></p>
        </div>
      </main>
    </div>
  );
}
