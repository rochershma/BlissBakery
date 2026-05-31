# Theobroma Online Ordering — Website Research

> **Date:** 24 May 2026  
> **Target Store:** Theobroma Sector 50, Noida  
> **URL:** https://order.theobroma.in/  
> **Platform:** Powered by [Uengage](https://www.uengage.in/)  
> **Mobile-friendly:** Yes — responsive design, bottom sticky "Search Menu" bar + "MENU" button on mobile viewport

---

## 1. Site-wide Navigation (Header)

| Link | URL | Notes |
|------|-----|-------|
| Home | `/` | Landing page, location/store picker, promo carousel |
| Order Now | `/store-locator` | City + Locality dropdowns, use-my-location |
| Products | `/products` | Product category gallery (no prices, catalogue-style) |
| Corporate | `https://theobroma.in` | External — main corporate site |
| Contact Us | `/contact-us` | Address, grievance officer, phone, email |
| Order Online | `/online-order` | Full store search — city/locality + text search + Google Places autocomplete |
| Download The App | `https://uen.io/theobroma` | Deep-link — Play Store / App Store |

**Profile sidebar** (hamburger / avatar icon) contains:
- Personal Information → `/profile`
- My Orders → `/past-order`
- Brownie Points (wallet) → `/wallet`
- Manage Addresses → `/manage-address`
- FAQs (modal/inline)
- How to track my Refund? → `/refund-policy`
- Logout

---

## 2. Pages & Routes Discovered

### 2.1 Public Pages (no login required)

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Hero carousel banners, promo offers carousel, Delivery/Pickup tabs, store-selection prompt, "Use my current location" / "Enter pickup location" |
| **Store Locator** | `/store-locator` | City dropdown (57+ cities), Locality dropdown (per city), "Use my current location" button, list of stores with "View Store" + "Order Online" actions |
| **Online Order (All Outlets)** | `/online-order` | Enhanced store finder — text search (Google Places autocomplete), city/locality dropdowns. Filters: Order Type (Delivery/Pickup/In-Car/Dine-In), Veg Only, Open Now, Newly Opened. Shows 295 total outlets across India |
| **Store View** | `/store-locator/{City}/{store-slug}` | Individual store page — name, address, hours (e.g. 08:00 AM – 11:00 PM), Delivery/Pickup availability, Directions (Google Maps), Call Outlet, FSSAI License No., special promos carousel, "Order Now" CTA |
| **Store Menu (Order Page)** | `/order/{store-slug}` | Full interactive menu for the selected outlet — categories, bestsellers, product cards with images, prices, ADD buttons, search, filters (Veg/Non Veg/What's New), promo offers strip |
| **Products Catalogue** | `/products` | Category gallery with images — 25 categories (see §4 below) |
| **Product Category** | `/products/{category-slug}` | Products in a specific category (e.g. `/products/cakes`) |
| **Contact Us** | `/contact-us` | Registered address, grievance officer name, phone (+91 8182-881881), email (contact@theobroma.in) |
| **Privacy Policy** | `/privacy-policy` | Full DPDP Act 2023 compliant policy — data collection, cookies, rights, grievance officer details |
| **Terms & Conditions** | `/terms-and-conditions` | Standard T&C — indemnity, liability, security rules, acceptable use |
| **Refund Policy** | `/refund-policy` | Once placed, orders cannot be cancelled. Failed payments auto-refund in 5-7 working days |
| **Promo Codes** | `/promo-codes` | Lists all active promos with copy-to-clipboard codes |
| **Cookie Policy** | `/cookie-policy` | 50+ cookies documented — essential, performance, functionality, advertising categories |

### 2.2 Authenticated Pages (login required)

| Page | Route | Description |
|------|-------|-------------|
| Profile | `/profile` | Personal information management |
| Past Orders | `/past-order` | Order history |
| Wallet (Brownie Points) | `/wallet` | Loyalty points balance and history |
| Manage Addresses | `/manage-address` | Saved delivery addresses |
| **Checkout** | `/checkout/{storeId}/{orderId}` | Cart review, promo codes, bill details, "Pay Securely" CTA |
| **Payment Gateway** | Razorpay embedded iframe | Full payment page with multiple methods (UPI, Cards, Netbanking, Wallets) |

---

## 3. User Flows

### 3.1 Store Selection Flow
```
Homepage → "Order Now" / "Enter pickup location"
  ├── Option A: "Use my current location" (browser geolocation)
  ├── Option B: "Enter the pickup/delivery location" (Google Places autocomplete text input)
  └── Option C: Select City dropdown → Select Locality dropdown → View stores → Click "Order Online"
      Filters available: Order Type (Delivery/Pickup/In-Car/Dine-In), Veg Only, Open Now, Newly Opened
```

### 3.2 Location Picker Dialog (Homepage)
```
Click outlet selector → Dialog: "Your Location" + "Change"
  → "Find Theobroma Outlet Near You"
    ├── "Use Your Current Location"
    ├── "Enter your Location Manually" → Google Places autocomplete dialog
    └── "Already have a Saved Address? Login"
  → Select order type: Pick Up | Delivery
```

### 3.3 Ordering Flow
```
Store Menu Page (/order/{store-slug})
  ├── Browse categories via sidebar MENU panel (collapsible)
  ├── Scroll through menu sections (Bestsellers, Combos, Mango Specials, Cakes, etc.)
  ├── Search Menu (text search)
  ├── Apply Filters: Veg | Non Veg | What's New | Filters
  ├── View promo offers strip (6+ OFFERS expandable)
  ├── Click ADD (+) button on any product
  │     ├── Simple products → added directly to cart
  │     └── Customisable products (combos) → opens customisation modal
  ├── Cart bar appears at bottom: "₹{total} | {n} items — View Cart"
  └── Click "View Cart" → LOGIN REQUIRED
```

### 3.4 Authentication Flow (Verified)
```
Any action needing auth (View Cart, Profile, Orders, etc.)
  → Login Modal (Step 1 — Method Selection):
    ├── "Continue with WhatsApp" (WhatsApp OTP — greyed out / primary button)
    ├── OR "Phone Number" (SMS OTP — outlined button)
    └── Checkbox: "To continue accept our Terms of Use and Privacy Policy"

  → Phone Number Login (Step 2 — Phone Entry):
    ├── Country code: +91 (India, fixed)
    ├── Text input: "Enter 10 Digits Phone No."
    ├── Security code: image CAPTCHA (6-digit code) + Refresh button
    ├── T&C checkbox (must be checked to enable Send OTP)
    ├── "Send OTP" button
    └── "Change login method" link (goes back to Step 1)

  → OTP Verification (Step 3):
    ├── 4-digit OTP input fields
    ├── "Resend OTP" timer/link
    └── Auto-verifies on correct OTP entry

  → New User Registration (Step 4 — only for first-time users):
    ├── "Welcome — Help us know you better!"
    ├── Full Name * (required)
    ├── Email Address (optional)
    ├── Gender * (required) — Male / Female radio buttons
    ├── Date of Birth (optional)
    ├── Anniversary (optional)
    ├── Referral Code (optional)
    └── "Submit" button
```

### 3.5 Cart & Checkout Flow (Verified)
```
After Login → Cart bar "View Cart" click
  → Checkout Page (/checkout/{storeId}/{orderId})

  ┌─ HEADER ─────────────────────────────────────────┐
  │ ← Back to Menu | Theobroma - Sector 50, Noida    │
  │ Pick Up | Change (order type switcher)             │
  └───────────────────────────────────────────────────┘

  ┌─ ITEMS ADDED ─────────────────────────────────────┐
  │ Product name [variant] × qty = ₹price             │
  │ Quantity controls: [-] [qty] [+]                   │
  │ "Add More Items" button                            │
  │ "Add Special Instructions" button (text input)     │
  └───────────────────────────────────────────────────┘

  ┌─ CRAVING MORE? (Upsell) ──────────────────────────┐
  │ Horizontal carousel of recommended add-on items    │
  └───────────────────────────────────────────────────┘

  ┌─ SAVINGS CORNER ──────────────────────────────────┐
  │ Auto-suggested promo codes with conditions         │
  │ e.g. "₹50 OFF above ₹500 — Add items worth ₹185" │
  │ "View More Offers" link                            │
  └───────────────────────────────────────────────────┘

  ┌─ PICKUP DETAILS ──────────────────────────────────┐
  │ Store address, pickup time selection               │
  └───────────────────────────────────────────────────┘

  ┌─ BILL DETAILS ────────────────────────────────────┐
  │ Item Total:           ₹315.00                      │
  │ Packaging Charges:    ₹14.29                       │
  │ GST (Govt. Taxes):    ₹16.46                       │
  │ ────────────────────────────                       │
  │ Grand Total:          ₹345.75                      │
  │                                                    │
  │ ⚠ "Orders once placed cannot be cancelled          │
  │    and are non-refundable"                         │
  │ ☑ "Yes, I would like to receive updates and        │
  │    exclusive offers from Theobroma" (pre-checked)  │
  └───────────────────────────────────────────────────┘

  ┌─ STICKY BOTTOM BAR ──────────────────────────────┐
  │        [ Pay Securely — ₹345.75 ]                 │
  └───────────────────────────────────────────────────┘
```

### 3.6 Payment Gateway (Razorpay — Verified)
```
Click "Pay Securely" → Razorpay payment page (embedded iframe)

  ┌─ RAZORPAY HEADER ────────────────────────────────┐
  │ Theobroma — Razorpay Trusted Business             │
  │ Amount: ₹345.75 | "View Details"                  │
  └───────────────────────────────────────────────────┘

  ┌─ AVAILABLE OFFERS ───────────────────────────────┐
  │ "Unlimited 1% cashback with Amazon Pay ICICI      │
  │  Bank Credit Card" + 3 more → "View all"          │
  └───────────────────────────────────────────────────┘

  ┌─ PAYMENT METHODS ────────────────────────────────┐
  │                                                    │
  │ 1. UPI QR (default/first shown)                    │
  │    ├── QR code with countdown timer (e.g. 2:20)   │
  │    ├── "Scan the QR using any UPI App"            │
  │    └── Supported: POP, Google Pay, CRED,           │
  │        PhonePe, Amazon Pay                         │
  │                                                    │
  │ 2. UPI (enter UPI ID)                              │
  │    ├── Google Pay                                  │
  │    ├── PhonePe                                     │
  │    ├── POP Club App                                │
  │    ├── Paytm                                       │
  │    └── "Upto 1.5% savings with NeuCard UPI txns"  │
  │                                                    │
  │ 3. Cards                                           │
  │    ├── Visa                                        │
  │    ├── Mastercard                                  │
  │    ├── RuPay                                       │
  │    ├── Amex                                        │
  │    └── "Get 5% Reward Points on online txns with   │
  │        PhonePe SBI Select Black Card"              │
  │                                                    │
  │ 4. Netbanking                                      │
  │    ├── SBI (SBIN)                                  │
  │    ├── HDFC                                        │
  │    ├── ICICI (ICIC)                                │
  │    └── Axis Bank (UTIB)                            │
  │                                                    │
  │ 5. Wallet                                          │
  │    ├── MobiKwik                                    │
  │    ├── Airtel Money                                │
  │    ├── Ola Money                                   │
  │    └── "Upto INR 200 back across 4 Amazon Pay      │
  │        Balance txns"                               │
  │                                                    │
  └───────────────────────────────────────────────────┘

  ┌─ FOOTER ─────────────────────────────────────────┐
  │ "Secured by Razorpay"                             │
  │ "Account & Terms"                                  │
  │ "By proceeding, I agree to Razorpay's Privacy      │
  │  Notice" • "Edit Preferences"                      │
  │ [ Continue ] button                                │
  └───────────────────────────────────────────────────┘
```

---

## 4. Product Categories (from /products page)

| # | Category | URL Slug |
|---|----------|----------|
| 1 | Combos @15% OFF | `combos-15-off` |
| 2 | Matchday Combos @15% OFF | `matchday-combos-15-off` |
| 3 | Value Combos | `value-combos` |
| 4 | Mango Specials | `mango-specials` |
| 5 | Cakes | `cakes` |
| 6 | Pastries & Desserts | `pastries-desserts` |
| 7 | Pastries | `pastries` |
| 8 | Brownies | `brownies` |
| 9 | Desserts & Cupcakes | `desserts-cupcakes` |
| 10 | Cupcakes | `cupcakes` |
| 11 | Savouries | `savouries` |
| 12 | Sandwiches & Savouries | `sandwiches-savouries` |
| 13 | Miscellaneous | `miscellaneous` |
| 14 | Croissants | `croissants` |
| 15 | Croissants, Danishes & Muffins | `croissants-danishes-muffins` |
| 16 | Tea Cakes | `tea-cakes` |
| 17 | Biscuits, Cookies & Crackers | `biscuits-cookies-crackers` |
| 18 | Gifting | `gifting` |
| 19 | Brother's Day Special | `brothers-day-special` |
| 20 | Breads | `breads` |
| 21 | Cake Add-Ons | `cake-add-ons` |
| 22 | Beverages | `beverages` |
| 23 | Chocolates | `chocolates` |
| 24 | Theobroma Collectibles | `theobroma-collectibles` |

---

## 5. Store Menu Categories (Sector 50, Noida — /order page sidebar)

| Category | Items Count |
|----------|------------|
| Featured Items | 6 |
| Combos @15% OFF | 20 (sub: Snack-time, Mini-meal, Meal Combos) |
| Mango Specials | 13 |
| Cakes | 22 |
| Pastries | 13 |
| Brownies | 26 |
| Desserts & Cupcakes | 5 |
| Sandwiches & Savouries | 14 |
| Croissants, Danishes & Muffins | 5 |
| Tea Cakes | 7 |
| Biscuits, Cookies & Crackers | 20 |
| Gifting | 10 |
| Brother's Day Special | 6 / 9 (two sections) |
| Breads | 4 |
| Cake Add-Ons | 21 |
| Chocolates | 9 |

---

## 6. Promo Codes (Active as of 24 May 2026)

| Code | Description |
|------|-------------|
| COMBO15 | FLAT 15% OFF on all combos (orders above ₹200) |
| COMBO10 | 10% OFF on all combos (orders above ₹200) |
| NEW50 | ₹50 OFF on orders above ₹500 |
| NEW80 | ₹80 OFF on orders above ₹800 |
| NEW125 | ₹125 OFF on orders above ₹1000 |
| NEW200 | ₹200 OFF on orders above ₹1500 |
| THB40 | ₹40 OFF on orders above ₹500 |
| THB75 | ₹75 OFF on orders above ₹800 |
| THB100 | ₹100 OFF on orders above ₹1000 |
| THB150 | ₹150 OFF on orders above ₹1500 |

---

## 7. Bestsellers at Sector 50, Noida

| Product | Price |
|---------|-------|
| Mava Cake [300g] | ₹315 |
| Dense Loaf [350g] | ₹295 |
| Butter Palmiers [3 Pieces] | ₹95 |
| Eggless Fresh Cream Pineapple Cake [500g] | ₹675 |
| Eggless Dutch Truffle Cake [500g] | ₹650 |
| Overload Brownie [1 Piece] | ₹130 |

---

## 8. Order Types Supported

| Type | Description |
|------|-------------|
| **Pick Up** | Customer picks up from store |
| **Delivery** | Home delivery (address required) |
| **In-Car** | In-car ordering (available at select outlets) |
| **Dine-In** | On-premises dining (available at select outlets) |

---

## 9. Store Information (Sector 50, Noida)

- **Name:** Theobroma
- **Location:** Sector 50, Noida
- **Hours:** Open from 08:00 AM to 11:00 PM (on store page) / 12:00 AM to 11:59 PM (on store locator)
- **Status:** OPEN
- **Business Name:** Theobroma Foods Pvt Ltd
- **FSSAI License No.:** 12725055002248
- **Services:** Delivery, Pickup
- **Directions:** Google Maps link
- **Call Outlet:** 8182881881
- **Available Offers:** 6 active promo codes

---

## 10. UI/UX Features

### Mobile-Friendly
- Responsive layout — hamburger menu, sticky bottom bar
- Bottom-fixed: "Search Menu" text input + "MENU" button
- Cart bar sticks to bottom: "₹{total} | {n} items — View Cart"
- Product cards: image left (or top on bestsellers), details right, ADD button
- Touch-friendly filter chips: Veg, Non Veg, What's New, Filters

### Desktop
- Full navigation bar across top
- Sidebar category menu for order page
- Inline promo banner carousel
- Profile dropdown sidebar

### Common UI Components
- **Promo carousel** — swipeable/scrollable offer cards with pagination dots
- **Search** — Menu search within store; Google Places autocomplete for location
- **Filters** — Veg/Non Veg toggle, "What's New", advanced Filters panel
- **Product cards** — Image, name, price, Bestseller badge, "ADD +" button
- **Customisable products** — "Customisable" label, opens chooser modal for combos
- **Cart bar** — Sticky bottom with total, item count, "View Cart" CTA
- **Login modal** — WhatsApp OTP or Phone Number OTP
- **Location picker dialog** — Multi-step: location select → order type select
- **Store info card** — Name, address, hours, status (OPEN/CLOSED), Get Directions, offers count

---

## 11. Footer Structure

### Useful Links
- Store Locator
- Privacy Policy
- Terms & Conditions
- Promo Codes
- Refund Policy
- Cookie Policy

### Payment Methods (via Razorpay)
- UPI QR (Google Pay, PhonePe, CRED, Amazon Pay, POP)
- UPI ID (Google Pay, PhonePe, Paytm, POP Club)
- Cards (Visa, Mastercard, RuPay, Amex)
- Netbanking (SBI, HDFC, ICICI, Axis + more)
- Wallets (MobiKwik, Airtel Money, Ola Money, Amazon Pay)

### Follow Us
- Facebook: https://www.facebook.com/theobromaindia
- Instagram: https://www.instagram.com/Theobromapatisserie/

### Contact & Connect
- Email: contact@theobroma.in
- Phone: 8182881881

### Platform
- Powered by Uengage (https://www.uengage.io/)
- © Copyright. All Rights Reserved

---

## 12. Technical Notes

- **Platform:** Uengage white-label ordering platform (CodeIgniter-based, PHP sessions)
- **Maps:** Google Maps JavaScript API (for location picker + directions)
- **Analytics:** Google Analytics (G-DRDYDB32N7, G-NJM0YZ808V), Google Ads (AW-318902264), Facebook Pixel (552693095953076), Microsoft Clarity, Bing Ads
- **Session Management:** PHP sessions (`ci_session`, `PHPSESSID`), cookies for outlet persistence (`slug`, `view_business`, `view_locality`)
- **Mobile Apps:** Android (Play Store) + iOS (App Store) — separate native apps
- **CDN:** cdn.uengage.io for product images
- **Auth:** Phone number OTP + WhatsApp OTP based login, image CAPTCHA on phone entry
- **Payment Gateway:** Razorpay (embedded iframe), supports UPI QR, UPI ID, Cards, Netbanking, Wallets
- **SSL:** HTTPS enforced

---

## 13. Key Policies Summary

### Refund Policy
- Once placed, orders **cannot be cancelled**
- Failed payments: if bank confirms within 15 min → order processed; after 15 min → auto-refund initiated
- Refund timeline: **5-7 working days**

### Privacy Policy
- DPDP Act 2023 compliant
- Data collected: name, email, phone, address, device info, location, browsing behaviour
- Grievance Officer: Ms. Simantini Budukh (privacy@theobroma.in)
- No data sold for commercial purposes
- Children under 18: explicit parental consent required

### Cookie Policy
- 50+ cookies across 4 categories (Essential, Performance, Functionality, Advertising)
- First-party + third-party (Google, Facebook, Microsoft, YouTube)
- Effective from 1 April 2024

---

## 14. Complete URL Map

```
https://order.theobroma.in/
├── /                                    (Home)
├── /store-locator                       (Store Locator - city/locality picker)
├── /store-locator/{City}/{store-slug}   (Individual Store View)
├── /online-order                        (All Outlets - search + filters)
├── /order/{store-slug}                  (Store Menu / Ordering Page)
├── /products                            (Product Categories Gallery)
├── /products/{category-slug}            (Product Category Page)
├── /contact-us                          (Contact Us)
├── /privacy-policy                      (Privacy Policy)
├── /terms-and-conditions                (Terms & Conditions)
├── /refund-policy                       (Refund Policy)
├── /promo-codes                         (Promo Codes Listing)
├── /cookie-policy                       (Cookie Policy)
├── /checkout/{storeId}/{orderId}         (Checkout Page — auth required)
├── /profile                             (User Profile — auth required)
├── /past-order                          (Order History — auth required)
├── /wallet                              (Brownie Points / Wallet — auth required)
├── /manage-address                      (Saved Addresses — auth required)
└── External:
    ├── https://theobroma.in             (Corporate Website)
    ├── https://uen.io/theobroma         (App Download Deep Link)
    ├── https://play.google.com/store/apps/details?id=com.app.uengage.theobroma  (Android App)
    └── https://apps.apple.com/app/id6447297511  (iOS App)
```
