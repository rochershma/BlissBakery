# Bliss Bakery — Work Status Tracker

> Auto-updated as work progresses. All times in IST.

---

## Current Phase: 🚀 Phase 1 — MVP Build

### Status Summary

| # | Task | Status | Started | Completed |
|---|------|--------|---------|-----------|
| 1 | Project initialization (Next.js 16, Node 24, Prisma, TypeScript) | ✅ Done | 24 May 2026 | 24 May 2026 |
| 2 | Database schema (Prisma + SQLite, 13 models) + seed data | ✅ Done | 24 May 2026 | 24 May 2026 |
| 3 | Auth system (WhatsApp + SMS OTP, JWT sessions, registration) | ✅ Done | 25 May 2026 | 25 May 2026 |
| 4 | Storefront: Home, Menu, Product Detail, Cart (guest-friendly) | ✅ Done | 24 May 2026 | 25 May 2026 |
| 5 | Checkout page + dummy payment simulation | ✅ Done | 25 May 2026 | 26 May 2026 |
| 6 | Order creation API + order confirmation page | ✅ Done | 26 May 2026 | 26 May 2026 |
| 7 | Custom Cakes page (visual selectors, image upload, WhatsApp) | ✅ Done | 25 May 2026 | 25 May 2026 |
| 8 | All static pages (About, Contact, Offers, Privacy, Terms, Refund, Addresses) | ✅ Done | 25 May 2026 | 26 May 2026 |
| 9 | Profile + My Orders + Manage Addresses pages | ✅ Done | 25 May 2026 | 25 May 2026 |
| 10 | Admin panel (Dashboard, Orders, Menu CRUD, Customers) | ✅ Done | 25 May 2026 | 26 May 2026 |
| 11 | Admin: Settings page (full store config) | ✅ Done | 28 May 2026 | 28 May 2026 |
| 12 | Admin: Assets page (upload + gallery + hero preview) | ✅ Done | 28 May 2026 | 28 May 2026 |
| 13 | Admin: Promo creation form | ✅ Done | 28 May 2026 | 28 May 2026 |
| 14 | Admin: Edit product (with image URL field) + Edit category | ✅ Done | 26 May 2026 | 28 May 2026 |
| 15 | File upload API (/api/admin/upload) | ✅ Done | 28 May 2026 | 28 May 2026 |
| 16 | Order status update API (admin/staff) | ✅ Done | 26 May 2026 | 26 May 2026 |
| 17 | Staff user created (phone 9999999999) | ✅ Done | 26 May 2026 | 26 May 2026 |
| 18 | Premium redesign: Gold-pink Tuileries-inspired theme | ✅ Done | 28 May 2026 | 28 May 2026 |
| 19 | Playfair Display + Inter fonts (consistent across all pages) | ✅ Done | 28 May 2026 | 28 May 2026 |
| 20 | Hero slider (Swiper.js, 3 Tuileries images, fade transition) | ✅ Done | 28 May 2026 | 28 May 2026 |
| 21 | Category circles (Swiggy-style round icons) | ✅ Done | 28 May 2026 | 28 May 2026 |
| 22 | Announcement bar (scrolling trust signals) | ✅ Done | 28 May 2026 | 28 May 2026 |
| 23 | Real Tuileries product images on all pages | ✅ Done | 28 May 2026 | 28 May 2026 |
| 24 | Mobile bottom navigation (Home/Menu/Cart/Account) | ✅ Done | 28 May 2026 | 28 May 2026 |
| 25 | WhatsApp floating button (responsive sizing) | ✅ Done | 28 May 2026 | 28 May 2026 |
| 26 | Product images in cart/checkout (real photos, not emojis) | ✅ Done | 28 May 2026 | 28 May 2026 |
| 27 | Swiggy/FNP-style animations (hover, stagger, bounce, glassmorphism) | ✅ Done | 25 May 2026 | 28 May 2026 |
| 28 | PWA manifest.json | ✅ Done | 25 May 2026 | 25 May 2026 |
| 29 | All pages verified working (no 404s) | ✅ Done | 26 May 2026 | 28 May 2026 |
| 30 | Razorpay LIVE payment | ⏳ Needs API keys from owner | — | — |
| 31 | WhatsApp API notifications | ⏳ Needs Interakt/Wati account | — | — |
| 32 | Real product photos + menu data | ⏳ Needs from owner | — | — |
| 33 | Domain + deployment | ⏳ Needs domain registration | — | — |

### Progress Log

#### 24 May 2026

- **12:30 PM** — Started project. Created PRD, Theobroma research doc.
- **8:45 PM** — Node.js upgraded to v24.16.0 LTS (from EOL v20.11.0).
- **9:00 PM** — Next.js 16.2.6 project created. All latest deps installed (Prisma 6.19.3, Zustand, Razorpay, Lucide, Zod).
- **9:05 PM** — Prisma schema created (13 models: Store, Banner, Category, Product, variants, addons, User, Address, Order, OrderItem, OrderStatusLog, CustomCakeOrder, PromoCode, OtpSession, Asset).
- **9:10 PM** — Database seeded: 1 store, 7 categories, 9 sample products, variants, add-ons, admin user, welcome promo code.
- **9:12 PM** — Pink/rose-gold theme configured (globals.css: #D4A0A0 primary, warm background, custom scrollbar, selection colors).
- **9:15 PM** — Home page built and rendering: hero banner, bestsellers grid, custom cakes CTA, shop by category, footer. Cart store (Zustand with localStorage persistence) created.
- **9:15 PM** — ✅ Dev server running at http://localhost:3000 — verified in browser, all sections rendering correctly.

#### 25 May 2026

- **3:30 PM** — Node upgraded to v24.16.0 LTS. Prisma client regenerated.
- **3:40 PM** — Menu page built (`/store/{slug}/menu`): header with store info, search bar, category filter chips (All/Cakes/Pastries/Brownies/Cookies/Breads/Combos/Beverages), product cards with veg indicator, BESTSELLER badge, prices, ADD+ buttons, sticky cart bar.
- **3:45 PM** — Product detail page built (`/store/{slug}/menu/{productSlug}`): hero image, Pure Veg + Eggless badges, description, size variant selector (500g/1kg/2kg), add-ons (Candles/Message Card/Cake Topper/Knife & Server), quantity controls, sticky "Add to Cart", "You may also like" related products.
- **3:50 PM** — Cart page built (`/cart`): items list with qty controls and delete, "Add More Items", "Notes" for special instructions, bill summary (Item Total + Packaging + GST = Grand Total), sticky "Proceed to Checkout" CTA. Hydration fix applied for Zustand SSR compatibility.
- **3:55 PM** — PWA manifest.json created. All storefront shopping pages verified in browser — full guest flow working (browse → add to cart → cart review → proceed to checkout) with NO login required.
- **3:55 PM** — ✅ STOREFRONT MILESTONE COMPLETE: Home, Menu, Product Detail, Cart all working end-to-end.
- **4:10 PM** — Auth system built: OTP send/verify APIs (JWT sessions, jose), AuthProvider context, LoginModal (phone → OTP → register). Login triggered only at checkout (no forced login).
- **4:20 PM** — Checkout page built: order summary, order type toggle, promo code (login-only), bill details, WhatsApp opt-in, Pay Securely CTA. Full OTP flow tested in browser.
- **4:30 PM** — Shared SiteHeader component with profile sidebar (Theobroma-style): Profile avatar, Personal Info, My Orders, Manage Addresses, Offers, Admin Panel (role-based), Logout. Login button for guests.
- **4:35 PM** — Profile page (`/profile`) built: view/edit name, phone (read-only), email, save changes.
- **4:40 PM** — My Orders page (`/orders`) built: past order history with status badges, payment status, reorder button. Orders API route created.
- **4:45 PM** — Admin panel: layout (sidebar desktop + bottom nav mobile), role-based auth guard, dashboard with stats + recent orders, orders list page, menu management page.
- **4:50 PM** — Home page restructured: store selector bar (Theobroma-style), secondary nav bar (Home/Order Now/Custom Cakes/Offers/About/Contact), order type toggle (Pickup/Delivery).
- **5:00 PM** — UX animations applied (Swiggy/FNP/JioMart inspired): glassmorphism header, product card hover lift + pink shadow, image zoom on hover, category card bounce, stagger fade-in for grids, ADD button scale animation, cart bar slide-up, button press effects, shimmer loading, nav link hover underline, smooth modal animations.
- **5:10 PM** — About page built: store story, values cards (100% Vegetarian, Made with Love, Premium Quality), CTA.
- **5:12 PM** — Contact page built: address card, phone, WhatsApp link, email, opening hours table.
- **5:15 PM** — Offers page built: promo code cards with gradient headers, copy button, login-required notice.
- **5:20 PM** — Custom Cakes page built: inspiration gallery (horizontal scroll), full form (name, phone, size, flavour, frosting, theme, message, description, image upload up to 5, date, budget), dual CTAs (Send via WhatsApp + Submit Order), success confirmation screen.

#### 26 May 2026

- Admin edit product + edit category pages created.
- Dummy payment simulation flow (order creation API + payment simulate API).
- Order confirmation page with status timeline (Confirmed → Preparing → Ready → Delivered).
- Order status update API for admin/staff with "Notify Customer" flag.
- Staff user created (phone 9999999999, STAFF role).
- Product detail: inline Add to Cart (no more sticky footer), "Added!" success animation.
- Cart: 2-column layout on desktop (items left, bill right).
- Custom cakes: visual chip selectors for size/flavour/frosting/budget (no more dropdowns).
- Login modal: SMS OTP option added alongside WhatsApp OTP.
- Custom cakes: buttons disabled until required fields filled.
- Product tiles made compact, floating cart pill on menu page.

#### 28 May 2026 — PREMIUM REDESIGN

- **Research phase:** Studied Tuileries Patisserie, Creme Castle, Theobroma in depth. Created redesign plan with gap analysis (20+ missing features identified).
- **Assets:** Copied Tuileries product/hero images to project (26 hero images, 9 product images).
- **Theme overhaul:** New premium gold-pink color palette (#C8A27C primary gold, #D4A0A0 rose pink, #FDF0EB warm pink background, #1E1916 dark sections).
- **Typography:** Playfair Display serif for headings, Inter for body. Consistent `font-serif` applied across ALL 20+ pages. Premium `label-premium` utility class for section headers.
- **Hero slider:** Swiper.js installed. 3-slide hero carousel with fade transition, auto-rotate (5s), pagination dots. Tuileries cake photography with dark overlay + elegant serif text.
- **Category circles:** Swiggy-style round icons with gradient backgrounds, horizontal scroll on mobile. 7 categories + Custom Cakes.
- **Announcement bar:** Dark scrolling trust signals ("100% Vegetarian & Eggless ✦ Same Day Pickup ✦ Premium Quality").
- **Trust badges:** Slim bar below hero (100% Vegetarian | Eggless | Same Day Pickup | Premium Quality).
- **Shop by Occasion:** Birthday, Anniversary, Wedding, Festival — image cards with dark gradient overlay.
- **Real product images:** All menu, product detail, cart, and related products sections now show Tuileries cake photography instead of emoji placeholders.
- **Mobile bottom nav:** Home | Menu | Cart | Account — Swiggy-style fixed bottom bar with active indicator + cart badge.
- **WhatsApp button:** Repositioned above mobile nav, smaller on phones (w-11 vs w-14).
- **Admin Settings page:** Full store configuration (name, address, hours, charges, GST, FSSAI, open/close toggle).
- **Admin Assets page:** Working file upload API + upload component with drag-and-drop, progress state, preview grid. Hero banner gallery + product image gallery.
- **Admin Promo creation:** Full form (code, type, value, min order, max discount, dates, limits, occasion tag, go-live toggle).
- **Admin Edit Product:** Added image URL field so admin can set product photos.
- **File upload API:** `/api/admin/upload` — real file storage to `public/uploads/`, saved to Asset DB, file type + size validation.
- **Cart product images:** Cart and checkout now show real product photos instead of emoji, passed through from menu/product pages.
- **Font consistency:** All headings across all pages (home, menu, product, cart, checkout, profile, orders, about, contact, offers, privacy, terms, refund, addresses, admin dashboard/orders/menu/promos/customers/settings/assets) updated to serif.
- **Background pinker:** Warmed up to #FDF0EB for more visible pink tone.
- **Compact menu:** Search bar + category chips combined into single sticky bar, slimmer store info bar, tighter product grid gaps.

---

## Blockers

| Blocker | Owner Action Needed |
|---------|-------------------|
| Razorpay live payments | Sign up at razorpay.com, provide API key + secret |
| WhatsApp notifications | Sign up at interakt.shop or wati.io, provide API key |
| Real product data | Provide full menu list with names, descriptions, prices |
| Real product photos | Take/provide product photos (phone photos OK) |
| Domain + hosting | Register domain (blissbakery.in?), set up Vercel |

## What's Done (29 items ✅)

- Full storefront: Home → Menu → Product → Cart → Checkout → Order Confirmation
- Premium gold-pink Tuileries-inspired design with real food photography
- Hero slider (3 slides, Swiper.js, auto-rotate)
- Category circles (Swiggy-style)
- Mobile bottom navigation
- Guest cart (no forced login)
- WhatsApp + SMS OTP authentication
- Custom Cakes page with visual selectors
- Admin panel: Dashboard, Orders, Menu CRUD (add/edit/delete products + categories), Promos (list + create), Customers, Assets (upload + gallery), Settings (full store config)
- File upload API (real file storage)
- Staff role support
- 22+ pages, all verified working

## What's Remaining for Launch (4 items)

1. **Razorpay live payment** — scaffolding done, just needs API keys
2. **WhatsApp API** — scaffolding done, just needs provider account
3. **Real product data + photos** — from owner
4. **Domain + deployment** — from owner

## Action Items (Owner)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | **Product photos** — need real photos for each product (cakes, pastries, brownies, cookies, breads) | ⏳ Needed | High-quality square photos, white/clean background preferred |
| 2 | **Category images** — one hero image per category (Cakes, Pastries, Brownies, etc.) | ⏳ Needed | Can use best product photo from each category |
| 3 | **Hero banners** — 3-5 images/videos for the homepage carousel (seasonal, featured, offers) | ⏳ Needed | Landscape format, can include text overlays |
| 4 | **Logo file** — high-res PNG of the Bliss Bakery circular logo (transparent background) | ⏳ Needed | For header, favicon, PWA icon |
| 5 | **Full menu list** — all products with names, descriptions, prices, sizes/variants | ⏳ Needed | Spreadsheet or list format fine |
| 6 | **Store details** — exact address, Google Maps pin, operating hours, FSSAI number | ⏳ Needed | For store page and footer |
| 7 | **Custom cake samples** — photos of past custom cakes for the inspiration gallery | ⏳ Needed | 10-20 photos ideal |
| 8 | **Razorpay account** — sign up at razorpay.com, get API keys | ⏳ Needed | For payment integration |
| 9 | **WhatsApp Business API** — set up via Interakt/Wati (for OTP + notifications) | ⏳ Needed | Can start with test mode |
| 10 | **Domain name** — register blissbakery.in or similar | ⏳ Needed | For production launch |

## Decisions Made

- Admin role covers all staff capabilities (no separate staff needed to operate)
- MVP scope: minimum viable, launch ASAP, extend later
- Premium gold-pink theme (Tuileries-inspired: #C8A27C gold, #D4A0A0 pink)
- Playfair Display serif headings + Inter sans-serif body
- WhatsApp-first, no forced login until payment
- Using Tuileries sample images as placeholders until owner provides real photos
- SQLite for development, PostgreSQL planned for production
- Swiper.js for carousels, Zustand for client state
