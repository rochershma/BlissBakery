import { SiteHeader } from "@/components/shared/site-header";

export default function RefundPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-4 py-8 page-enter">
        <h1 className="text-2xl font-bold text-foreground mb-6 font-serif">Refund Policy</h1>
        <div className="bg-white rounded-2xl border border-border p-6 prose prose-sm max-w-none text-foreground/80 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800">
            <p className="font-semibold">⚠️ Please Note: This policy applies to all Bliss Bakery online orders.</p>
          </div>

          <h2 className="text-lg font-bold text-foreground">Your Money is Secure</h2>
          <p>If your amount has been deducted from UPI, Debit/Credit Card, Net Banking, or Wallet — please do not worry. Your money is safe as per consumer safeguarding guidelines.</p>

          <h2 className="text-lg font-bold text-foreground">Cancellation Policy</h2>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
            <p className="font-semibold">Once orders are placed, they cannot be cancelled.</p>
          </div>
          <p>We understand that situations may arise where you need to cancel an order. However, please note that once orders are placed, they cannot be cancelled. We start preparing your order as soon as it is confirmed.</p>
          <p>We encourage all customers to double-check their orders before finalizing them to ensure accuracy and satisfaction.</p>

          <h2 className="text-lg font-bold text-foreground">Payment Issues</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>It usually happens when bank servers are not able to confirm the payment status immediately</li>
            <li>If bank confirms the payment to our servers within <strong>15 minutes</strong>, your order will be processed automatically</li>
            <li>If bank confirms the payment to our servers after 15 minutes, then our system will reject the order and <strong>initiate the refund automatically</strong></li>
            <li>After refund is initiated, it takes <strong>5-7 working days</strong> to get the amount back in your account</li>
          </ul>

          <h2 className="text-lg font-bold text-foreground">Exceptions</h2>
          <p>Exceptions may be considered in extraordinary circumstances, such as unavailability of ingredients or unforeseen emergencies. These exceptions will be assessed on a case-by-case basis and are not guaranteed.</p>

          <h2 className="text-lg font-bold text-foreground">Support</h2>
          <p>For further support and queries:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email: <a href="mailto:hello@blissbakery.in" className="text-primary">hello@blissbakery.in</a></li>
            <li>WhatsApp: <a href="https://wa.me/919602831559" className="text-primary" target="_blank" rel="noopener">+91 9602831559</a></li>
            <li>Phone: <a href="tel:9602831559" className="text-primary">+91 9602831559</a></li>
          </ul>
        </div>
      </main>
    </div>
  );
}
