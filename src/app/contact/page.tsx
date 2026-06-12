import { SiteHeader } from "@/components/shared/site-header";
import { db } from "@/lib/db";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { parseJsonSafe } from "@/lib/utils";

export const revalidate = 3600; // ISR: re-generate every hour

export default async function ContactPage() {
  const store = await db.store.findFirst();

  const hours = parseJsonSafe<Record<string, { open: string; close: string }>>(
    store?.operatingHours || null, {}
  );

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-gradient-to-br from-primary/10 via-primary-light to-secondary py-12 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 font-serif">Contact Us</h1>
          <p className="text-muted-foreground">We&apos;d love to hear from you!</p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-8 page-enter">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="space-y-4">
            <div className="category-card bg-white rounded-2xl border border-border p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Visit Us</h3>
                  <p className="text-sm text-muted-foreground">
                    {store?.address || "Main Market"}, {store?.city || "Kuchaman City"}, {store?.state || "Rajasthan"}
                  </p>
                </div>
              </div>
            </div>

            <div className="category-card bg-white rounded-2xl border border-border p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Call Us</h3>
                  <a href={`tel:${store?.phone}`} className="text-sm text-primary hover:underline">
                    +91 {store?.phone || "9602831559"}
                  </a>
                </div>
              </div>
            </div>

            <div className="category-card bg-white rounded-2xl border border-border p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">WhatsApp</h3>
                  <a
                    href={`https://wa.me/91${store?.phone || "9602831559"}`}
                    target="_blank"
                    rel="noopener"
                    className="text-sm text-green-600 hover:underline"
                  >
                    Chat with us on WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {store?.email && (
              <div className="category-card bg-white rounded-2xl border border-border p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Email</h3>
                    <a href={`mailto:${store.email}`} className="text-sm text-primary hover:underline">
                      {store.email}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Opening Hours */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Opening Hours
            </h3>
            <div className="space-y-2">
              {days.map((day, i) => {
                const h = hours[dayKeys[i]];
                return (
                  <div key={day} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                    <span className="text-foreground font-medium">{day}</span>
                    <span className="text-muted-foreground">
                      {h ? `${h.open} – ${h.close}` : "Closed"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
