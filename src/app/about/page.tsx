import { SiteHeader } from "@/components/shared/site-header";
import { MapPin, Clock, Leaf, Heart, Award, Users } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-primary-light to-secondary py-16 animate-fade-in">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 font-serif">
            About <span className="text-primary">Bliss Bakery</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A passion for baking, a commitment to 100% vegetarian &amp; eggless goodness
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 py-12 page-enter">
        {/* Story */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground font-serif mb-4">Our Story</h2>
          <div className="prose prose-sm text-foreground/80 space-y-4">
            <p>
              Bliss Bakery was born from a simple belief — that everyone deserves to enjoy
              delicious, fresh, and beautifully crafted baked goods, made without eggs and
              100% vegetarian. Based in the heart of Kuchaman City, Rajasthan, we&apos;ve been
              serving our community with love, one cake at a time.
            </p>
            <p>
              Every product that leaves our kitchen is made with the finest ingredients,
              traditional recipes, and a touch of modern creativity. From our signature
              Vanilla Cream Cake to our decadent Chocolate Truffle, we take pride in
              crafting treats that bring smiles to faces.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 stagger-children">
          <div className="category-card bg-white rounded-2xl border border-border p-6 text-center">
            <div className="category-icon w-14 h-14 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
              <Leaf className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-bold text-foreground mb-2">100% Vegetarian</h3>
            <p className="text-sm text-muted-foreground">
              Every product is pure vegetarian and eggless. No exceptions, no compromises.
            </p>
          </div>
          <div className="category-card bg-white rounded-2xl border border-border p-6 text-center">
            <div className="category-icon w-14 h-14 mx-auto mb-3 rounded-full bg-pink-50 flex items-center justify-center">
              <Heart className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Made with Love</h3>
            <p className="text-sm text-muted-foreground">
              Handcrafted daily with fresh ingredients and traditional recipes passed down through generations.
            </p>
          </div>
          <div className="category-card bg-white rounded-2xl border border-border p-6 text-center">
            <div className="category-icon w-14 h-14 mx-auto mb-3 rounded-full bg-yellow-50 flex items-center justify-center">
              <Award className="w-7 h-7 text-yellow-600" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Premium Quality</h3>
            <p className="text-sm text-muted-foreground">
              Only the finest ingredients — real butter, premium chocolate, fresh fruits, and pure flavors.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-primary/10 to-secondary rounded-2xl p-8">
          <h2 className="text-xl font-bold text-foreground font-serif mb-2">Ready to taste the bliss?</h2>
          <p className="text-muted-foreground mb-4">Order online or visit us at our store in Kuchaman City</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary-hover transition-colors btn-press"
          >
            Order Now →
          </Link>
        </div>
      </main>
    </div>
  );
}
