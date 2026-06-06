"use client";

import { SiteHeader } from "@/components/shared/site-header";
import { useState } from "react";
import { ArrowLeft, Upload, Send, MessageCircle, X, Cake, Palette, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";

const flavours = [
  { name: "Vanilla", emoji: "🍦" },
  { name: "Chocolate", emoji: "🍫" },
  { name: "Red Velvet", emoji: "❤️" },
  { name: "Butterscotch", emoji: "🧈" },
  { name: "Pineapple", emoji: "🍍" },
  { name: "Strawberry", emoji: "🍓" },
  { name: "Mango", emoji: "🥭" },
  { name: "Black Forest", emoji: "🌲" },
  { name: "Other", emoji: "✨" },
];
const frostings = [
  { name: "Buttercream", emoji: "🧁" },
  { name: "Fondant", emoji: "🎀" },
  { name: "Whipped Cream", emoji: "☁️" },
  { name: "Ganache", emoji: "🍫" },
  { name: "Cream Cheese", emoji: "🧀" },
];
const sizes = [
  { name: "500g", serves: "4-6", emoji: "🎂" },
  { name: "1 kg", serves: "8-10", emoji: "🎂🎂" },
  { name: "2 kg", serves: "15-20", emoji: "🎂🎂🎂" },
  { name: "3 kg", serves: "25-30", emoji: "👑" },
  { name: "5 kg", serves: "40-50", emoji: "🏆" },
];
const budgets = ["₹500 - ₹1,000", "₹1,000 - ₹2,000", "₹2,000 - ₹5,000", "₹5,000 - ₹10,000", "₹10,000+"];

export default function CustomCakesPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    size: "",
    flavour: "",
    frosting: "",
    theme: "",
    messageOnCake: "",
    description: "",
    preferredDate: "",
    budget: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }
    setImages([...images, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews([...previews, ...newPreviews]);
  }

  function removeImage(idx: number) {
    setImages(images.filter((_, i) => i !== idx));
    setPreviews(previews.filter((_, i) => i !== idx));
  }

  const phoneValid = /^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ""));
  const isFormValid = form.name.trim() && phoneValid && form.size && form.flavour;

  async function handleSubmit() {
    if (!isFormValid) return;
    try {
      const res = await fetch("/api/custom-cakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerPhone: form.phone.replace(/\s/g, ""),
          cakeSize: form.size,
          baseFlavour: form.flavour,
          frosting: form.frosting || null,
          theme: form.theme || null,
          messageOnCake: form.messageOnCake || null,
          preferredDate: form.preferredDate || null,
          budget: form.budget || null,
          specialNotes: form.description || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.message || "Failed to submit. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
  }

  function handleWhatsApp() {
    if (!isFormValid) return;
    const text = encodeURIComponent(
      `🎂 Custom Cake Order\n\n` +
      `Name: ${form.name}\nPhone: ${form.phone}\n` +
      `Size: ${form.size}\nFlavour: ${form.flavour}\n` +
      `Frosting: ${form.frosting}\nTheme: ${form.theme}\n` +
      `Message: ${form.messageOnCake}\n` +
      `Description: ${form.description}\n` +
      `Date: ${form.preferredDate}\nBudget: ${form.budget}`
    );
    window.open(`https://wa.me/919602831559?text=${text}`, "_blank");
  }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <SiteHeader />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center animate-fade-in-up">
          <div className="text-6xl mb-4">🎂</div>
          <h2 className="text-2xl font-bold text-foreground font-serif mb-2">Request Submitted!</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Our team will review your custom cake request and share a quote on WhatsApp within 2 hours.
          </p>
          <div className="flex gap-3">
            <Link href="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary-hover transition-colors btn-press">
              Back to Home
            </Link>
            <button
              onClick={handleWhatsApp}
              className="bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors btn-press flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" /> WhatsApp Us
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-accent/10 via-primary-light to-primary/10 py-10 animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 font-serif">
            Design Your Dream Cake
          </h1>
          <p className="text-muted-foreground">
            Tell us what you want — we&apos;ll craft it with love. Birthdays, weddings, anniversaries &amp; more!
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-3 md:px-4 py-6 page-enter pb-32" style={{ maxWidth: '100%' }}>
        {/* Inspiration Gallery Placeholder */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground font-serif mb-3">Popular Custom Cake Styles</h2>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2" style={{ maxWidth: '100%' }}>
            {[
              { label: "Kids Theme", bg: "from-pink-100 to-pink-50" },
              { label: "Floral Wedding", bg: "from-rose-100 to-rose-50" },
              { label: "Photo Cake", bg: "from-amber-100 to-amber-50" },
              { label: "Bento Cake", bg: "from-orange-100 to-orange-50" },
              { label: "Chocolate Drip", bg: "from-yellow-100 to-yellow-50" },
              { label: "Minimal Cream", bg: "from-green-100 to-green-50" },
            ].map((style, i) => (
              <div key={i} className={`w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-2xl bg-gradient-to-br ${style.bg} flex items-center justify-center text-center p-2 border border-border/30 hover:shadow-sm transition-shadow cursor-pointer`}>
                <span className="text-xs font-semibold text-foreground leading-tight">{style.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Share your reference image and we&apos;ll create it for you</p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Contact */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> Your Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Your Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Cake Details */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Cake className="w-4 h-4 text-primary" /> Cake Details
            </h3>

            {/* Size — visual cards */}
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground mb-2">Select Size *</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" style={{ maxWidth: '100%' }}>
                {sizes.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setForm({ ...form, size: s.name })}
                    className={`flex-shrink-0 w-[72px] px-2 py-3 rounded-xl border-2 text-center transition-all btn-press ${
                      form.size === s.name
                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                        : "bg-white text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-lg">{s.emoji}</span>
                    <p className="text-sm font-bold mt-1">{s.name}</p>
                    <p className="text-[10px] opacity-70">serves {s.serves}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Flavour — visual chips */}
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground mb-2">Select Flavour *</p>
              <div className="flex flex-wrap gap-2">
                {flavours.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setForm({ ...form, flavour: f.name })}
                    className={`px-3 py-2 rounded-full text-sm font-medium border transition-all btn-press flex items-center gap-1.5 ${
                      form.flavour === f.name
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <span>{f.emoji}</span> {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Frosting — visual chips */}
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground mb-2">Select Frosting</p>
              <div className="flex flex-wrap gap-2">
                {frostings.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setForm({ ...form, frosting: f.name })}
                    className={`px-3 py-2 rounded-full text-sm font-medium border transition-all btn-press flex items-center gap-1.5 ${
                      form.frosting === f.name
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <span>{f.emoji}</span> {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="🎉 Theme / Occasion (e.g., Birthday, Unicorn, Wedding)"
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="text"
                placeholder="✍️ Message on Cake (e.g., Happy Birthday Rahul!)"
                value={form.messageOnCake}
                onChange={(e) => setForm({ ...form, messageOnCake: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Design Description */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" /> Design Description
            </h3>
            <textarea
              placeholder="Describe your dream cake — colors, decorations, characters, layers, etc."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />

            {/* Image Upload */}
            <div className="mt-3">
              <p className="text-sm font-medium text-foreground mb-2">Reference Images (up to 5)</p>
              <div className="flex flex-wrap gap-3">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Date & Budget */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> When &amp; Budget
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">📅 Preferred Date</p>
                <input
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">💰 Budget Range</p>
                <div className="flex flex-wrap gap-2">
                  {budgets.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setForm({ ...form, budget: b })}
                      className={`px-3 py-2 rounded-full text-sm font-medium border transition-all btn-press ${
                        form.budget === b
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white text-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] cart-bar-enter">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {!isFormValid && (
            <p className="text-xs text-muted-foreground text-center mb-2">
              Fill in name, phone, size &amp; flavour to continue
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleWhatsApp}
              disabled={!isFormValid}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors btn-press disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-5 h-5" />
              Send via WhatsApp
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors btn-press disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              Submit Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
