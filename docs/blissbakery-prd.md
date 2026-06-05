# BlissBakery — Product Requirements Document (PRD)

> **Version:** 1.1  
> **Date:** 24 May 2026  
> **Author:** Product & Engineering (AI-assisted)  
> **Business:** Bliss Bakery — Kuchaman City, Rajasthan  
> **Status:** DRAFT v1.1 — Owner feedback incorporated  
> **Brand:** 100% Vegetarian & Eggless Bakery  
> **Theme:** Pink/Rose Gold (#D4A0A0 primary, soft pinks, warm whites)  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context](#2-business-context)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [User Personas](#4-user-personas)
5. [Customer-Facing Website (Storefront)](#5-customer-facing-website-storefront)
6. [Admin Panel (Owner/Staff Dashboard)](#6-admin-panel-ownerdashboard)
7. [Notifications & Communication](#7-notifications--communication)
8. [Payment Integration](#8-payment-integration)
9. [Asset & Content Management](#9-asset--content-management)
10. [Technical Specification](#10-technical-specification)
11. [Data Models](#11-data-models)
12. [API Design](#12-api-design)
13. [Security Requirements](#13-security-requirements)
14. [Launch Plan](#14-launch-plan)
15. [Future Extensibility](#15-future-extensibility)
16. [Development Prompt (Self-Prompt for Build)](#16-development-prompt)

---

## 1. Executive Summary

**Bliss Bakery** is a 100% vegetarian & eggless bakery in Kuchaman City, Rajasthan, seeking a fully functional, mobile-first online ordering platform — similar to Theobroma's `order.theobroma.in` but tailored for a single-store (expandable to multi-store) artisan bakery.

**Core goal:** Customers discover, browse, add to cart freely (no login wall), pay, and receive WhatsApp updates — all from their phone or desktop browser. The owner manages everything from an admin dashboard.

**Key differentiators from Theobroma:**
- **100% Vegetarian & Eggless** — brand identity, no non-veg options anywhere
- **No forced login** — guests browse & build cart freely, login only at payment (modern UX)
- **Custom Cake Orders** — customers design custom cakes via text, image uploads, inspiration gallery
- **WhatsApp-first everything** — OTP, order to staff, status to customer, promos
- **All orders forwarded to staff WhatsApp** — real-time team awareness
- **Pink/Rose Gold brand theme** — matching the Bliss Bakery logo and identity
- Single store initially (expandable to multi-store)
- Owner-managed (no platform dependency like Uengage)
- Self-hosted, full control of data and branding
- Progressive Web App, secure, easily extensible

---

## 2. Business Context

### 2.1 Business Profile

| Field | Value |
|-------|-------|
| **Business Name** | Bliss Bakery |
| **Tagline** | 100% Vegetarian & Eggless Bakery |
| **Legal Entity** | TBD (owner to confirm) |
| **Location** | Kuchaman City, Rajasthan, India |
| **Store Count** | 1 (current), 2nd planned for future |
| **Brand Colors** | Primary: Rose/Pink (#D4A0A0), Accents: Soft pink, Cream, Warm white |
| **Logo** | Circular rose-gold logo with "bb" monogram + "Bliss Bakery" text |
| **FSSAI License** | Owner to provide |
| **GST Number** | Owner to provide |
| **Contact Phone** | Owner to provide |
| **Contact Email** | Owner to provide |
| **Social Media** | Instagram / Facebook (owner to provide handles) |
| **Operating Hours** | Owner to confirm (e.g. 8:00 AM – 10:00 PM) |
| **Order Types** | Pick Up, Delivery (within Kuchaman City radius) |
| **Food Type** | 100% Vegetarian & Eggless only |

### 2.2 Business Goals

1. **Enable online ordering** — customers place orders from phone/desktop
2. **Reduce phone-call orders** — self-service ordering reduces load
3. **Increase average order value** — upsells, combos, promo codes
4. **Build customer database** — phone numbers, preferences, order history
5. **WhatsApp engagement** — order status, promos, repeat order nudges
6. **Professional brand presence** — modern, fast, beautiful website
7. **Owner autonomy** — manage menu, prices, availability, orders without developer help

### 2.3 Success Metrics (Post-Launch)

- Orders through website per day
- Customer registration count
- Average order value
- Repeat order rate
- WhatsApp message delivery rate
- Cart abandonment rate

---

## 3. System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CUSTOMER DEVICES                      │
│         (Mobile Browser / Desktop Browser)               │
│              blissbakery.in                              │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js / React)                   │
│         Server-Side Rendered + Static Pages              │
│    Mobile-first responsive design (PWA-capable)          │
└────────────────────┬────────────────────────────────────┘
                     │ REST API / Server Actions
                     ▼
┌─────────────────────────────────────────────────────────┐
│               BACKEND (Next.js API / Node.js)            │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Auth     │  │ Orders   │  │ Notifications        │  │
│  │ (OTP)    │  │ Engine   │  │ (WhatsApp + Email)   │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Menu &   │  │ Payments │  │ Asset Manager         │  │
│  │ Products │  │ (Razorpay│  │ (Images/Files)       │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│  ┌──────────┐  ┌──────────┐                             │
│  │ Promo    │  │ Analytics│                             │
│  │ Engine   │  │ & Reports│                             │
│  └──────────┘  └──────────┘                             │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────────┐
        ▼            ▼                ▼
┌──────────┐  ┌──────────────┐  ┌──────────────────┐
│ Database │  │ File Storage │  │ External Services│
│(Postgres)│  │ (S3/Cloudflr)│  │                  │
└──────────┘  └──────────────┘  │ • Razorpay       │
                                │ • WhatsApp API   │
                                │ • SMS Gateway    │
                                │ • Google Maps    │
                                │ • Email (SMTP)   │
                                └──────────────────┘
┌─────────────────────────────────────────────────────────┐
│                  ADMIN PANEL                             │
│              admin.blissbakery.in                         │
│    (Owner/Staff: manage menu, orders, promos, assets)    │
└─────────────────────────────────────────────────────────┘
```

---

## 4. User Personas

### 4.1 Customer (End User)
- Local Kuchaman City resident (and surrounding areas)
- Primarily uses mobile (Android) on 4G/5G
- Hindi + English comfortable
- Wants quick browse, easy ordering, WhatsApp updates
- Should NOT be forced to log in to browse or add to cart
- May want to order custom cakes with specific designs/flavors

### 4.2 Owner (Admin)
- Bliss Bakery owner — full control of everything
- Manages menu, prices, availability, store hours
- Uploads product images AND videos (hero banners, product media)
- Creates/manages promo codes, makes them live for occasions
- Views orders in real-time, marks them as ready/completed
- Can click "Notify Customer" to send WhatsApp status update
- Views sales reports, payment statuses, customer data
- Separate admin login (phone OTP + admin role)

### 4.3 Staff (Day 1 — Not Future)
- Kitchen staff: sees incoming orders on dashboard/tablet
- Can update order status (Preparing → Ready, etc.)
- Can click "Notify Customer" button on each order status change
- Receives ALL new orders via WhatsApp (staff group or individual)
- Separate staff login (phone OTP + staff role)
- Delivery person: gets delivery assignments with customer details

---

## 5. Customer-Facing Website (Storefront)

### 5.1 Pages & Routes

| # | Page | Route | Description |
|---|------|-------|-------------|
| 1 | **Store Selector** | `/` | Choose store (or auto-detect nearest), select Pickup/Delivery, then proceed |
| 2 | **Home / Landing** | `/store/{slug}` | Hero banner (images+videos), store info, bestsellers, categories, offers, "Order Now" |
| 3 | **Menu / Order** | `/store/{slug}/menu` | Full menu with categories, product cards, search, filters (Eggless/Bestseller/New), ADD to cart (NO login required) |
| 4 | **Custom Cakes** | `/store/{slug}/custom-cakes` | Custom cake order — choose flavors, upload reference images, describe design, view samples |
| 5 | **Product Detail** | `/store/{slug}/menu/{product-slug}` | Full product page — images, description, variants, allergens, ADD to cart |
| 6 | **Cart** | `/cart` | Cart review, qty controls, special instructions, upsells (NO login required) |
| 7 | **Checkout** | `/checkout` | Login prompt (if guest), promo code (login-only), address, bill details, "Pay Securely" |
| 8 | **Order Confirmation** | `/order/{orderId}` | "Order Placed!" details, estimated time, track status |
| 9 | **Order Tracking** | `/order/{orderId}/track` | Real-time status timeline: Confirmed → Preparing → Ready → Delivered/Picked Up |
| 10 | **My Orders** | `/orders` | Past order history with payment status, reorder button |
| 11 | **Profile** | `/profile` | Name, phone, email, edit profile |
| 12 | **Manage Addresses** | `/addresses` | Add/edit/delete delivery addresses |
| 13 | **About Us** | `/about` | Store story, photos, team |
| 14 | **Contact Us** | `/contact` | Address, phone, email, WhatsApp link, map embed |
| 15 | **Offers** | `/offers` | Active offers — visible to all, redeemable after login |
| 16 | **Privacy Policy** | `/privacy` | Privacy policy |
| 17 | **Terms & Conditions** | `/terms` | T&C |
| 18 | **Refund Policy** | `/refund-policy` | Cancellation + refund policy |
| 19 | **Login/Register** | Modal (no separate page) | WhatsApp OTP login — triggered only at checkout/promo redemption |

### 5.2 Home Page (`/`)

**Entry flow:** User lands on `/` → Store Selector (choose store + Pickup/Delivery) → redirects to `/store/{slug}` home.

```
┌───────────────────────────────────────────────────┐
│ HEADER (pink/rose gold accent)                     │
│ [☰ Menu]  [Bliss Bakery Logo]  [🛒 Cart] [👤]    │
│ 🌿 100% Vegetarian & Eggless                      │
└───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────┐
│ HERO BANNER (admin-managed images + VIDEOS)        │
│ [Swipeable carousel — seasonal specials, new       │
│  products, festival offers, video autoplay]        │
│ (Theobroma-style full-width hero)                  │
└───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────┐
│ STORE INFO BAR                                     │
│ 📍 Kuchaman City | ⏰ Open 8AM-10PM | 📞 Call     │
│ [🛍 Pick Up] [🚗 Delivery]  ← chosen at entry     │
└───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────┐
│ 🔥 OFFERS STRIP (horizontal scroll)               │
│ [₹50 OFF > ₹500] [10% OFF Combos] [Free item..]  │
│ (Offers visible to all, redeemable after login)   │
└───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────┐
│ ⭐ BESTSELLER CAKES (horizontal card carousel)     │
│ [Img+Name+Price+ADD] [Img+Name+Price+ADD] ...     │
└───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────┐
│ 🎂 CUSTOM CAKES BANNER                             │
│ "Design Your Dream Cake" → /custom-cakes          │
│ [See samples] [Start designing]                    │
└───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────┐
│ 📂 SHOP BY CATEGORY (grid of category cards)       │
│ [Cakes] [Pastries] [Brownies] [Cookies] ...       │
└───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────┐
│ 📱 DOWNLOAD APP BANNER (future)                    │
└───────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────┐
│ FOOTER (pink accent)                               │
│ Links | Contact | Social | Payment icons | © 2026 │
└───────────────────────────────────────────────────┘
```

### 5.3 Menu / Order Page (`/menu`)

**Layout:**
- **Top:** Store name, status (Open/Closed), order type toggle (Pickup/Delivery)
- **Search bar:** "Search menu..." with instant filtering
- **Filter chips:** Eggless | Bestseller | New | Cakes | Cookies (since everything is veg, no veg/non-veg toggle needed)
- **Category sidebar** (desktop) / **bottom sheet MENU button** (mobile)
- **"Custom Cakes" special entry** in category list — leads to custom order flow
- **Product sections** grouped by category, each with:

**Product Card:**
```
┌──────────────────────────────────┐
│ [Product Image]                  │
│ 🟢 Pure Veg   🥚✗ Eggless       │
│ ⭐ Bestseller badge (if applies) │
│ Product Name                     │
│ Short description (1-2 lines)    │
│ ₹Price        [ADD +] button    │
└──────────────────────────────────┘
```

> **KEY UX DECISION:** ADD to cart works WITHOUT login.
> Guest users build their cart freely. Login is prompted
> only at checkout when they click "Pay Securely".

**Product with variants:**
- Click ADD → opens variant/customisation bottom sheet
- Select size (e.g. 500g / 1kg), flavour, add-ons
- Shows updated price, then "Add to Cart"

**Cart bar (sticky bottom):**
```
┌──────────────────────────────────────────┐
│ ₹{total} | {n} items    [View Cart →]   │
└──────────────────────────────────────────┘
```

### 5.4 Product Detail Page (`/menu/{slug}`)

- Hero image (full-width on mobile, gallery on desktop)
- Product name, price, 🟢 Pure Veg + 🥚✗ Eggless badges
- Full description
- Ingredients list (optional, admin-managed)
- Variants selector (size, flavour)
- Add-ons selector (e.g. candles ₹20, message card ₹30, cake topper ₹50)
- Quantity selector
- "Add to Cart" button (NO login needed)
- "You may also like..." recommendations

### 5.4a Custom Cakes Page (`/custom-cakes`) ⭐ NEW

A dedicated section where customers can request custom/design cakes.

```
┌───────────────────────────────────────────────────┐
│ 🎂 Design Your Dream Cake                         │
│                                                    │
│ ┌─ INSPIRATION GALLERY ─────────────────────────┐ │
│ │ [Sample 1] [Sample 2] [Sample 3] [Sample 4]   │ │
│ │ (Admin-uploaded photos of past custom cakes)   │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ ┌─ YOUR CUSTOM ORDER ───────────────────────────┐ │
│ │ Cake Size: [Dropdown: 500g / 1kg / 2kg / 3kg] │ │
│ │ Base Flavour: [Dropdown: Vanilla/Chocolate/    │ │
│ │   Red Velvet/Butterscotch/Pineapple/Custom]    │ │
│ │ Frosting: [Dropdown: Buttercream/Fondant/      │ │
│ │   Whipped Cream/Ganache]                       │ │
│ │ Theme/Occasion: [Text: Birthday/Wedding/etc.]  │ │
│ │ Message on Cake: [Text input]                  │ │
│ │ Design Description: [Textarea — describe what  │ │
│ │   you want, colors, characters, etc.]          │ │
│ │ Reference Images: [📎 Upload up to 5 images]   │ │
│ │ Preferred Delivery Date: [Date picker]         │ │
│ │ Budget Range: [Dropdown: ₹500-1000 / ₹1000-   │ │
│ │   2000 / ₹2000-5000 / ₹5000+]                 │ │
│ │ Your Phone: [Auto-filled if logged in]         │ │
│ │                                                │ │
│ │ [📱 Submit via WhatsApp]  [📋 Submit Order]    │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ ℹ️ Our team will review your request and share a  │
│   quote on WhatsApp within 2 hours.               │
└───────────────────────────────────────────────────┘
```

**Custom order flow:**
1. Customer fills form + uploads images
2. Submitted as a "Custom Order" in admin panel
3. Also auto-forwarded to staff WhatsApp with all details + images
4. Staff reviews, quotes a price, sends back via WhatsApp
5. Customer confirms → staff creates formal order in admin → payment link sent
6. Normal order lifecycle begins (Confirmed → Preparing → Ready)

### 5.5 Cart Page (`/cart`) — NO LOGIN REQUIRED

**Accessible without login.** Guest users see their full cart.

1. **Header:** Back to menu, Store name
2. **Items Added:** Each item with image, name, variant, qty ± controls, price, remove button
3. **Add More Items:** Link back to menu
4. **Special Instructions:** Free-text input for kitchen notes
5. **You Might Like (Upsell):** Horizontal carousel of suggested add-ons
6. **Sticky CTA:** `[ Proceed to Checkout — ₹{total} ]`

### 5.5a Checkout Page (`/checkout`) — LOGIN REQUIRED HERE

**When user clicks "Proceed to Checkout":**
- If **not logged in** → Login modal appears (WhatsApp OTP)
- If **logged in** → proceed directly

**Checkout sections (post-login):**

1. **Header:** Back to cart, Store name, Order type (Pickup/Delivery + Change)
2. **Order Summary:** Collapsed item list, expandable
3. **Savings Corner:** Promo codes (ONLY available to logged-in users)
   - Auto-suggested applicable codes
   - "Apply Coupon" text input
   - Shows "Login to unlock offers" for guests (but they're already logged in here)
4. **Order Type Section:**
   - **Pickup:** Store address shown, optional pickup time selector
   - **Delivery:** Address selector (saved addresses or add new), delivery charge shown
5. **Bill Details:**
   - Item Total
   - Delivery Charge (if delivery) / ₹0 for Pickup
   - Packaging Charges
   - Discount (if coupon applied, shown in green)
   - GST (calculated)
   - **Grand Total**
6. **Consent:** "Orders once placed cannot be cancelled" warning
7. **Marketing opt-in:** "Send me offers on WhatsApp" checkbox (pre-checked)
8. **Sticky CTA:** `[ Pay Securely — ₹{grandTotal} ]`

**After payment completes:**
- Order created in system
- Order details sent to staff WhatsApp (full item list + customer info)
- Confirmation WhatsApp sent to customer
- Redirect to Order Confirmation page

**Payment status handling (graceful):**
- **Success** → Order confirmed, WhatsApp sent, redirect to confirmation
- **Failed** → "Payment failed" screen, retry button, no order created
- **Pending** → "Payment processing..." screen, auto-polls for status, resolves to success/fail
- **Timeout** → "We couldn't confirm your payment. If debited, it will be refunded in 5-7 days."
- All statuses reflected in Order History with proper labels & colors

### 5.6 Order Confirmation & Tracking (`/order/{id}`)

```
┌───────────────────────────────────┐
│ ✅ Order Placed Successfully!      │
│ Order #BB-00123                    │
│ Estimated Ready: ~30 mins         │
│                                    │
│ ──── ORDER STATUS ────            │
│ ● Confirmed     ✔ (now)          │
│ ○ Preparing                       │
│ ○ Ready for Pickup / Out for Del  │
│ ○ Completed / Delivered           │
│                                    │
│ ──── ORDER SUMMARY ────           │
│ Mava Cake × 1         ₹315       │
│ Packaging               ₹14      │
│ GST                     ₹16      │
│ Total                  ₹345      │
│ Paid via UPI           ✔         │
│                                    │
│ [📞 Call Store]  [📱 WhatsApp]    │
│ [🔄 Reorder]                      │
└───────────────────────────────────┘
```

### 5.7 Authentication Flow (Login-Free Until Payment)

**Philosophy:** Never block the user. Let them browse, add to cart, explore freely. Only ask for login when they're ready to pay — at that point they're committed.

**Trigger points for login modal:**
- Click "Pay Securely" at checkout
- Click "Apply Promo Code" (promos are login-only perks)
- Click "My Orders" or "Profile" (account pages)
- Click "Submit" on custom cake order

```
Step 1: Login Modal (WhatsApp-first)
  ├── "Continue with WhatsApp" (primary, green button)
  │     → Opens WhatsApp with pre-filled OTP request message
  │     → OTP received back in-app
  ├── OR "Use SMS instead" (secondary, text link)
  │     → Phone number input (+91, 10-digit)
  │     → SMS OTP sent
  └── T&C consent link (inline, not blocking)

Step 2: OTP Verification
  ├── 4-digit OTP input (auto-focus, auto-advance)
  ├── 60-second resend timer
  ├── "Resend via SMS" / "Resend via WhatsApp" toggle
  └── Auto-login on correct OTP

Step 3: New User Registration (first-time only)
  ├── Full Name * (required)
  ├── Email (optional)
  └── "Continue" button

Post-login: return to exact same screen (checkout continues seamlessly)
Cart state: preserved across login (guest cart → authenticated cart merge)
```

### 5.8 My Orders Page (`/orders`)

- List of all past orders, newest first
- Each order card: Order #, date, items summary, total, status badge
- "Reorder" button → adds all items to current cart
- Click order → full order detail + tracking

### 5.9 Profile Page (`/profile`)

- View/edit: Name, Phone (read-only), Email
- Manage Addresses link
- Order History link
- Logout button

---

## 6. Admin Panel (Owner/Staff Dashboard)

### 6.1 Admin Routes

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin` | Today's stats — orders, revenue, pending orders |
| Orders | `/admin/orders` | Live order queue with status management |
| Menu Management | `/admin/menu` | Add/edit/delete categories and products |
| Promo Codes | `/admin/promos` | Create/manage discount codes |
| Customers | `/admin/customers` | Customer list, order history, contact |
| Assets | `/admin/assets` | Upload/manage product images, banners |
| Store Settings | `/admin/settings` | Store info, hours, delivery zones, charges |
| Reports | `/admin/reports` | Sales, orders, popular items, revenue charts |
| Notifications | `/admin/notifications` | WhatsApp broadcast, order status templates |
| Staff Management | `/admin/staff` | Manage staff accounts, assign roles, WhatsApp groups |

> **Note:** Admin role inherits ALL staff capabilities. If no staff is available, admin
> can do everything staff does (manage orders, update status, notify customers).
> Admin = Staff + Management + Settings + Reports.

### 6.2 Dashboard (`/admin`)

```
┌──────────────────────────────────────────────────┐
│ BlissBakery Admin                    [Owner Name]│
├──────────────────────────────────────────────────┤
│                                                   │
│  TODAY'S SNAPSHOT                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐       │
│  │  12  │ │ ₹4.2K│ │  3   │ │ ₹350 Avg │       │
│  │Orders│ │Revenue│ │Pending│ │Ord Value │       │
│  └──────┘ └──────┘ └──────┘ └──────────┘       │
│                                                   │
│  PENDING ORDERS (live, auto-refresh)             │
│  ┌────────────────────────────────────────┐      │
│  │ #BB-123 | Mava Cake ×2 | ₹630 | 5m ago│      │
│  │ [Accept] [Ready] [Complete] [Cancel]   │      │
│  └────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────┐      │
│  │ #BB-124 | Brownie ×3 | ₹390 | 2m ago  │      │
│  │ [Accept] [Ready] [Complete] [Cancel]   │      │
│  └────────────────────────────────────────┘      │
│                                                   │
│  RECENT ACTIVITY                                 │
│  • Order #BB-122 completed                       │
│  • New customer: Rahul (9876...)                 │
│  • Promo WELCOME10 used 3 times today            │
│                                                   │
└──────────────────────────────────────────────────┘
```

### 6.3 Order Management (`/admin/orders`)

**Order Lifecycle:**
```
New → Confirmed → Preparing → Ready → Out for Delivery → Delivered/Picked Up
                                  └→ (for pickup) → Picked Up
```

**Each status change:**
- Admin/Staff clicks status button
- **"Notify Customer" button** appears — click to send WhatsApp notification
  - Not auto-sent (gives staff control over when to notify)
  - Status still recorded internally even without notification
- Timestamp recorded for every status change
- All status history visible in order detail
- ALL new orders also forwarded to staff WhatsApp group/number automatically

**Order Detail View:**
- Customer name, phone (click to WhatsApp/call)
- Items list with variants and special instructions
- Payment status (Paid/Pending/Failed)
- Order type (Pickup/Delivery) + address if delivery
- Action buttons to advance status
- Print order (for kitchen)

### 6.4 Menu Management (`/admin/menu`)

**Categories:**
- Create/edit/delete categories
- Reorder categories (drag-and-drop)
- Set category image
- Toggle category visibility (show/hide)

**Products:**
- Name, Description (short + long)
- Price (base price)
- Variants (e.g. Size: 300g ₹315, 500g ₹495, 1kg ₹850)
- Add-ons (e.g. Candles ₹20, Message Card ₹30, Cake Topper ₹50)
- Category assignment
- Images (multiple, first = primary) + **Video support** (MP4, for hero/product showcase)
- 🟢 Pure Veg tag (always on — entire bakery is veg & eggless)
- Bestseller flag, New flag, Featured flag
- Availability toggle (in-stock / out-of-stock)
- Available for: Pickup / Delivery / Both
- Ingredients list (optional text)

### 6.5 Promo Code Management (`/admin/promos`)

| Field | Description |
|-------|-------------|
| Code | e.g. WELCOME10 |
| Discount Type | Percentage / Flat amount |
| Discount Value | e.g. 10% or ₹50 |
| Min Order Value | e.g. ₹300 |
| Max Discount Cap | e.g. ₹100 (for percentage) |
| Valid From/To | Date range |
| Usage Limit | Total uses allowed |
| Per-User Limit | Uses per customer |
| Applicable To | All / Specific categories / Specific products |
| **Occasion Tag** | e.g. Diwali, Rakhi, New Year, Birthday (for easy management) |
| **Go Live / Pause** | One-click toggle to make promo live or pause instantly |
| **Login Required** | ✅ Yes — promos only redeemable by logged-in users (incentivizes account creation) |
| Active Toggle | On/Off |

### 6.6 Asset Manager (`/admin/assets`)

- **Media Library:** Upload, browse, delete images AND videos
- **Auto-resize:** Uploaded images auto-optimized (thumbnail, medium, full)
- **Video support:** MP4 upload for hero banners and product showcases (max 30s, auto-compressed)
- **Hero Banner Manager:** Drag-and-drop reorder, set images OR videos, link each slide to a product/category/offer
- **Usage tracking:** Shows which products/banners use each asset
- **Drag-and-drop upload**
- **Folders:** Organize by category (Products, Banners, Store Photos, Custom Cake Samples, Videos)
- **Supported formats:** JPEG, PNG, WebP (images), MP4 (video)
- **Max file size:** 5MB per image, 25MB per video

### 6.7 Store Settings (`/admin/settings`)

- Store name, description, logo
- Operating hours (per day of week)
- Holiday/closed dates
- Contact info (phone, email, address)
- FSSAI license number, GST number
- Delivery settings:
  - Delivery radius (km) or pin code list
  - Minimum order for delivery
  - Delivery charge (flat or distance-based)
  - Estimated delivery time
- Packaging charge (flat or percentage)
- GST rate configuration
- Payment gateway keys (Razorpay)
- WhatsApp API configuration
- Social media links

### 6.8 Reports (`/admin/reports`)

- **Daily/Weekly/Monthly revenue** — line chart
- **Orders count** — bar chart
- **Top selling products** — ranked list
- **Average order value** trend
- **Customer acquisition** — new vs returning
- **Promo code performance** — usage, discount given, AOV impact
- **Export to CSV/Excel**

---

## 7. Notifications & Communication

### 7.1 WhatsApp Notifications (Primary Channel)

**Integration:** WhatsApp Business API (via provider like Interakt, Wati, or Twilio)

| Trigger | Template | Content |
|---------|----------|---------|
| OTP | Login OTP | "Your Bliss Bakery OTP is {code}. Valid for 5 minutes. 🍰" |
| Order Placed | Order Confirmation | "Hi {name}! Your order #{id} is confirmed. Items: {summary}. Total: ₹{total}. We're preparing your treats! 🧁" |
| Order Preparing | Status Update | "Your order #{id} is now being prepared by our bakers. 👨‍🍳" |
| Order Ready | Ready for Pickup | "Your order #{id} is ready for pickup! Visit Bliss Bakery, Kuchaman City. 📍" |
| Out for Delivery | Delivery Update | "Your order #{id} is out for delivery! 🚗 Estimated arrival: {time}" |
| Delivered | Delivery Confirmed | "Your order #{id} has been delivered! Enjoy your treats! 🎉 Rate us: {link}" |
| Payment Failed | Payment Alert | "Payment failed for order #{id}. Try again: {link}. Need help? Call {phone}" |
| Payment Pending | Status Alert | "We're confirming your payment for order #{id}. If debited, it will reflect within 15 mins." |
| Promo Broadcast | Marketing | "🎂 {promo_text}. Order now: {link}. Use code {code}" |
| Abandoned Cart | Recovery | "Hi {name}, you left items in your cart! Complete your order: {link}" |
| Custom Cake Received | Custom Order | "Hi {name}! We received your custom cake request. Our team will share a quote within 2 hours. 🎂" |
| Custom Cake Quote | Quote Response | "Great news! Your custom cake quote is ready: {details}. Confirm here: {link}" |

### 7.2 Staff/Team WhatsApp Notifications (Orders to Team) ⭐ NEW

**Every order is automatically forwarded to the staff WhatsApp number/group.**

| Trigger | Sent To | Content |
|---------|---------|--------|
| New Order Placed | Staff group/number | "📢 NEW ORDER #{id}\n{customer_name} ({phone})\nType: {pickup/delivery}\n{item_list}\nTotal: ₹{total}\nInstructions: {notes}" |
| Custom Cake Request | Staff group/number | "🎂 CUSTOM CAKE REQUEST\n{customer_name} ({phone})\nSize: {size}, Flavour: {flavour}\nFrosting: {frosting}\nTheme: {theme}\nMessage: {msg}\nDescription: {desc}\nDelivery: {date}\nBudget: {range}\n[{image_links}]" |
| Payment Confirmed | Staff group/number | "✅ Payment confirmed for #{id} — ₹{total}" |
| Payment Failed | Staff group/number | "❌ Payment failed for #{id} — customer may retry" |

**Admin/Staff "Notify Customer" button:**
- On each order in admin panel, a "Notify Customer" button appears next to each status change
- Staff clicks it to send the corresponding WhatsApp message to the customer
- This gives staff control (e.g., they may want to wait until cake is actually boxed before sending "Ready")

### 7.3 SMS Fallback

- Same triggers as WhatsApp, shorter templates
- Used when WhatsApp delivery fails
- OTP always sent via both WhatsApp + SMS for reliability

### 7.4 Admin Notifications

- **New order alert** → WhatsApp to staff group + browser notification + sound on admin panel
- **Payment received** → confirmation in admin + WhatsApp to staff
- **Payment failed** → alert in admin + WhatsApp to staff
- **Custom cake request** → WhatsApp to staff with full details + images
- **Low stock alert** (future) → WhatsApp to owner

---

## 8. Payment Integration

### 8.1 Razorpay Integration

| Feature | Requirement |
|---------|-------------|
| **Gateway** | Razorpay Standard Checkout |
| **Methods** | UPI (QR + ID), Cards (Visa/MC/RuPay/Amex), Netbanking, Wallets |
| **Currency** | INR only |
| **Auto-capture** | Yes (capture on authorization) |
| **Webhooks** | Payment success, failure, refund events |
| **Refunds** | Admin-initiated partial/full refunds via dashboard |
| **Test Mode** | Full test mode support for development |

### 8.2 Payment Flow

```
Checkout Page → Click "Pay Securely"
  → Create Razorpay Order (backend)
  → Open Razorpay Checkout (frontend)
  → Customer selects payment method & pays
  → Razorpay callback → backend verifies signature
  → Success: Create order, send confirmation, redirect to order page
  → Failure: Show error, allow retry, no order created
```

### 8.3 Cash on Delivery (Optional — owner configurable)

- Toggle in admin settings
- Available only for delivery orders
- Min order amount for COD configurable

---

## 9. Asset & Content Management

### 9.1 Image Pipeline

```
Owner uploads image (admin panel)
  → Client-side validation (format, size)
  → Upload to server
  → Server processes:
     ├── Original (stored, not served)
     ├── Full (max 1200px wide, WebP)
     ├── Medium (600px wide, WebP)
     └── Thumbnail (300px wide, WebP)
  → Stored in cloud storage (S3/Cloudflare R2)
  → CDN-served with cache headers
  → URLs saved in database
```

### 9.2 Content Managed by Owner (Admin Panel)

- Store name, description, about text
- Hero banners (image + link/action)
- Product names, descriptions, prices, images
- Category names and images
- Promo code details
- Operating hours and holiday calendar
- Contact information
- Policy pages content (rich text editor)

---

## 10. Technical Specification

### 10.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 14+ (App Router) | SSR for SEO, React for UI, API routes for backend |
| **Language** | TypeScript | Type safety, better DX |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI dev, mobile-first, consistent design |
| **Database** | PostgreSQL (via Supabase or Neon) | Relational, reliable, great for e-commerce |
| **ORM** | Prisma | Type-safe DB queries, migrations |
| **Auth** | Custom OTP (phone-based) | No email/password, phone-first for India |
| **Payments** | Razorpay JS SDK | Indian payments, UPI, all methods |
| **WhatsApp** | Interakt / Wati API (or Twilio) | Templated messages, OTP, broadcasts |
| **File Storage** | Cloudflare R2 or AWS S3 | Cost-effective image hosting |
| **CDN** | Cloudflare | Fast delivery, image optimization |
| **Hosting** | Vercel (frontend) + Railway/Render (DB) | Easy deploy, auto-scaling |
| **Real-time** | Server-Sent Events or Polling | Admin order notifications |
| **Analytics** | Plausible / PostHog (self-hosted) | Privacy-respecting analytics |

### 10.2 Project Structure

```
blissbakery/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (storefront)/       # Customer-facing pages
│   │   │   ├── page.tsx        # Home
│   │   │   ├── menu/
│   │   │   │   ├── page.tsx    # Menu listing
│   │   │   │   └── [slug]/page.tsx  # Product detail
│   │   │   ├── checkout/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── order/[id]/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── addresses/page.tsx
│   │   │   ├── offers/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   └── refund-policy/page.tsx
│   │   ├── admin/              # Admin panel
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── orders/page.tsx
│   │   │   ├── menu/page.tsx
│   │   │   ├── promos/page.tsx
│   │   │   ├── customers/page.tsx
│   │   │   ├── assets/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── notifications/page.tsx
│   │   ├── api/                # API routes
│   │   │   ├── auth/
│   │   │   ├── menu/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── promos/
│   │   │   ├── upload/
│   │   │   └── webhooks/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── storefront/         # Customer-facing components
│   │   ├── admin/              # Admin components
│   │   └── shared/             # Shared components
│   ├── lib/
│   │   ├── db.ts               # Prisma client
│   │   ├── auth.ts             # OTP auth logic
│   │   ├── razorpay.ts         # Payment utils
│   │   ├── whatsapp.ts         # WhatsApp API client
│   │   ├── sms.ts              # SMS gateway client
│   │   ├── storage.ts          # File upload/storage utils
│   │   └── utils.ts            # Shared utilities
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # Cart state (Zustand)
│   └── types/                  # TypeScript types
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── README.md
```

### 10.3 Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s on 3G |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.1 |
| Time to Interactive | < 3.5s on 3G |
| Lighthouse Mobile Score | > 90 |
| Page Size (initial) | < 200KB gzipped |
| Image format | WebP with JPEG fallback |

---

## 11. Data Models

### Core Entities (Prisma Schema Overview)

```prisma
model Store {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique
  description   String?
  address       String
  city          String
  state         String
  pincode       String
  phone         String
  email         String?
  latitude      Float?
  longitude     Float?
  fssaiLicense  String?
  gstNumber     String?
  logo          String?   // URL
  isOpen        Boolean   @default(true)
  operatingHours Json     // { mon: { open: "08:00", close: "22:00" }, ... }
  deliveryRadius Float?   // km
  minDeliveryOrder Float? // min amount for delivery
  deliveryCharge Float?
  packagingCharge Float?
  gstRate        Float    @default(5.0)
  createdAt     DateTime  @default(now())
  categories    Category[]
  orders        Order[]
}

model Category {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  image       String?
  sortOrder   Int       @default(0)
  isVisible   Boolean   @default(true)
  storeId     String
  store       Store     @relation(fields: [storeId], references: [id])
  products    Product[]
}

model Product {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique
  description   String?
  shortDesc     String?
  basePrice     Float
  images        String[]  // array of URLs
  isVeg         Boolean   @default(true)   // Always true for Bliss Bakery
  isEggless     Boolean   @default(true)   // Always true for Bliss Bakery
  isBestseller  Boolean   @default(false)
  isNew         Boolean   @default(false)
  isAvailable   Boolean   @default(true)
  allergenInfo  String?
  categoryId    String
  category      Category  @relation(fields: [categoryId], references: [id])
  variants      ProductVariant[]
  addOns        ProductAddOn[]
  orderItems    OrderItem[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model CustomCakeOrder {
  id              String   @id @default(cuid())
  orderNumber     String   @unique  // CC-00001
  userId          String?
  user            User?    @relation(fields: [userId], references: [id])
  customerName    String
  customerPhone   String
  cakeSize        String   // "500g", "1kg", "2kg", "3kg"
  baseFlavour     String
  frosting        String?
  theme           String?  // "Birthday", "Wedding", etc.
  messageOnCake   String?
  designDescription String? // detailed text description
  referenceImages String[] // array of uploaded image URLs
  preferredDate   DateTime?
  budgetRange     String?  // "500-1000", "1000-2000", etc.
  status          CustomOrderStatus @default(RECEIVED)
  adminNotes      String?
  quotedPrice     Float?
  convertedOrderId String? // linked to Order if confirmed
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum CustomOrderStatus {
  RECEIVED
  REVIEWING
  QUOTED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model ProductVariant {
  id          String  @id @default(cuid())
  name        String  // e.g. "500g", "1kg"
  price       Float
  isAvailable Boolean @default(true)
  productId   String
  product     Product @relation(fields: [productId], references: [id])
}

model ProductAddOn {
  id          String  @id @default(cuid())
  name        String  // e.g. "Candles", "Message Card"
  price       Float
  isAvailable Boolean @default(true)
  productId   String
  product     Product @relation(fields: [productId], references: [id])
}

model User {
  id          String    @id @default(cuid())
  phone       String    @unique
  name        String?
  email       String?
  role        Role      @default(CUSTOMER)
  addresses   Address[]
  orders      Order[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum Role {
  CUSTOMER
  ADMIN
  STAFF
}

model Address {
  id          String  @id @default(cuid())
  label       String? // "Home", "Office"
  fullAddress String
  landmark    String?
  pincode     String
  latitude    Float?
  longitude   Float?
  isDefault   Boolean @default(false)
  userId      String
  user        User    @relation(fields: [userId], references: [id])
}

model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique  // BB-00001
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  storeId         String
  store           Store       @relation(fields: [storeId], references: [id])
  status          OrderStatus @default(PENDING)
  orderType       OrderType
  deliveryAddress String?
  specialInstructions String?
  itemTotal       Float
  deliveryCharge  Float       @default(0)
  packagingCharge Float       @default(0)
  discount        Float       @default(0)
  tax             Float
  grandTotal      Float
  promoCode       String?
  paymentId       String?     // Razorpay payment ID
  paymentStatus   PaymentStatus @default(PENDING)
  items           OrderItem[]
  statusHistory   OrderStatusLog[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  OUT_FOR_DELIVERY
  DELIVERED
  PICKED_UP
  CANCELLED
}

enum OrderType {
  PICKUP
  DELIVERY
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  order       Order   @relation(fields: [orderId], references: [id])
  productId   String
  product     Product @relation(fields: [productId], references: [id])
  productName String  // snapshot at order time
  variantName String?
  quantity    Int
  unitPrice   Float
  addOns      Json?   // snapshot of selected add-ons
  totalPrice  Float
}

model OrderStatusLog {
  id        String      @id @default(cuid())
  orderId   String
  order     Order       @relation(fields: [orderId], references: [id])
  status    OrderStatus
  note      String?
  createdAt DateTime    @default(now())
}

model PromoCode {
  id            String    @id @default(cuid())
  code          String    @unique
  discountType  DiscountType
  discountValue Float
  minOrderValue Float?
  maxDiscount   Float?     // cap for percentage
  validFrom     DateTime
  validTo       DateTime
  usageLimit    Int?
  perUserLimit  Int        @default(1)
  usedCount     Int        @default(0)
  isActive      Boolean    @default(true)
  createdAt     DateTime   @default(now())
}

enum DiscountType {
  PERCENTAGE
  FLAT
}

model OtpSession {
  id        String   @id @default(cuid())
  phone     String
  otp       String
  expiresAt DateTime
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Asset {
  id        String   @id @default(cuid())
  filename  String
  url       String
  thumbnail String?
  mimeType  String
  size      Int      // bytes
  folder    String?  // "products", "banners", "store"
  createdAt DateTime @default(now())
}
```

---

## 12. API Design

### 12.1 Public APIs (Customer)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/store` | Store info, hours, status |
| GET | `/api/menu` | All categories + products |
| GET | `/api/menu/{slug}` | Single product detail |
| GET | `/api/offers` | Active promo codes |
| POST | `/api/auth/send-otp` | Send OTP to phone |
| POST | `/api/auth/verify-otp` | Verify OTP, return session |
| POST | `/api/auth/register` | Complete profile (new user) |
| GET | `/api/user/profile` | Get user profile (auth) |
| PUT | `/api/user/profile` | Update profile (auth) |
| GET | `/api/user/addresses` | List addresses (auth) |
| POST | `/api/user/addresses` | Add address (auth) |
| PUT | `/api/user/addresses/{id}` | Update address (auth) |
| DELETE | `/api/user/addresses/{id}` | Delete address (auth) |
| POST | `/api/custom-cakes` | Submit custom cake order (guest or auth) |
| GET | `/api/custom-cakes/{id}` | Custom cake order status |
| POST | `/api/orders` | Create order (auth) |
| GET | `/api/orders` | List user's orders (auth) |
| GET | `/api/orders/{id}` | Order detail (auth) |
| POST | `/api/orders/{id}/reorder` | Reorder past order (auth) |
| POST | `/api/payments/create` | Create Razorpay order (auth) |
| POST | `/api/payments/verify` | Verify payment signature |
| POST | `/api/promo/validate` | Validate promo code against cart |

### 12.2 Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Today's stats |
| GET | `/api/admin/orders` | All orders (paginated, filterable) |
| PUT | `/api/admin/orders/{id}/status` | Update order status |
| GET/POST/PUT/DELETE | `/api/admin/categories/*` | CRUD categories |
| GET/POST/PUT/DELETE | `/api/admin/products/*` | CRUD products |
| GET/PUT | `/api/admin/custom-cakes` | View/manage custom cake orders |
| PUT | `/api/admin/custom-cakes/{id}/quote` | Send quote for custom cake |
| GET/POST/PUT/DELETE | `/api/admin/promos/*` | CRUD promo codes (with go-live toggle) |
| GET | `/api/admin/customers` | Customer list |
| POST | `/api/admin/upload` | Upload asset |
| GET | `/api/admin/assets` | List assets |
| DELETE | `/api/admin/assets/{id}` | Delete asset |
| GET/PUT | `/api/admin/settings` | Store settings |
| GET | `/api/admin/reports/*` | Various reports |

### 12.3 Webhook Endpoints

| Endpoint | Source | Purpose |
|----------|--------|---------|
| `/api/webhooks/razorpay` | Razorpay | Payment status updates |
| `/api/webhooks/whatsapp` | WhatsApp provider | Delivery receipts, incoming messages |

---

## 13. Security Requirements

| Area | Requirement |
|------|-------------|
| **Authentication** | Phone OTP only, session tokens (HttpOnly cookies), 5-min OTP expiry |
| **Authorization** | Role-based: Customer, Admin, Staff. Admin routes protected server-side |
| **Rate Limiting** | OTP: max 3 per phone per 15 min. API: 100 req/min per IP |
| **Input Validation** | Zod schemas on all API inputs, server-side validation |
| **Payment Security** | Razorpay signature verification, no card data stored, PCI compliance via Razorpay |
| **HTTPS** | Enforced everywhere, HSTS headers |
| **CSRF** | Same-site cookies, origin checking |
| **XSS** | React auto-escaping, CSP headers |
| **SQL Injection** | Prisma parameterized queries (no raw SQL) |
| **File Upload** | Type validation, size limits, no executable uploads |
| **Data Privacy** | DPDP Act 2023 compliant privacy policy, data deletion on request |
| **Admin Access** | Separate auth, strong OTP, IP allowlist option |

---

## 14. Launch Plan

### Phase 1: MVP (Target: 4-6 weeks)

- [x] PRD & Spec (this document)
- [ ] Database schema & seed data
- [ ] Auth system (OTP login)
- [ ] Menu display (categories, products, search, filters)
- [ ] Cart & checkout flow
- [ ] Razorpay payment integration
- [ ] Order management (customer side: place, view, track)
- [ ] Admin: dashboard + order management + menu CRUD
- [ ] WhatsApp notifications (order status)
- [ ] Responsive mobile-first design
- [ ] Deploy to production
- [ ] Add real menu data + product photos

### Phase 2: Polish (Weeks 5-8)

- [ ] Promo code engine
- [ ] Asset manager (admin)
- [ ] Delivery zone configuration
- [ ] Customer address management
- [ ] Upsell/cross-sell suggestions
- [ ] Reports & analytics
- [ ] SEO optimization (meta tags, OG images, structured data)
- [ ] PWA support (install prompt, offline menu cache)

### Phase 3: Growth (Post-Launch)

- [ ] Abandoned cart WhatsApp recovery
- [ ] Loyalty points / rewards
- [ ] Scheduled orders (advance ordering)
- [ ] Staff roles (kitchen display, delivery assignment)
- [ ] Multi-store support (2nd store)
- [ ] Customer reviews and ratings
- [ ] Push notifications (web)
- [ ] Native mobile app (React Native, if needed)
- [ ] Google Business Profile integration
- [ ] Social media auto-posting

---

## 15. Future Extensibility

The architecture is designed to easily extend:

| Extension | How |
|-----------|-----|
| **Multi-store** | Store model already supports multiple stores, add store selector to frontend |
| **Dine-In / In-Car** | Add new `OrderType` enum values, minimal UI changes |
| **Staff roles** | Role-based auth already in schema, add kitchen display view |
| **Loyalty points** | Add `WalletTransaction` model, points on each order |
| **Subscriptions** | "Weekly cake box" — recurring orders via cron + Razorpay subscriptions |
| **Inventory management** | Add stock count to Product/Variant, auto-disable when 0 |
| **Multilingual** | Hindi + English — use next-intl for i18n |
| **Native apps** | Share API layer, build React Native apps against same backend |
| **Third-party delivery** | Integrate Dunzo/Porter API for delivery dispatch |

---

## 16. Development Prompt (Self-Prompt for Build)

> **PROMPT FOR AI ENGINEER (self):**
>
> You are building **Bliss Bakery** — a complete, production-ready online ordering platform for a 100% vegetarian & eggless bakery in Kuchaman City, Rajasthan. Follow the PRD in `blissbakery-prd.md` exactly.
>
> **Tech stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, Razorpay, WhatsApp API.
>
> **Brand:** Pink/Rose Gold theme (#D4A0A0 primary). Logo is circular with "bb" monogram. 100% Veg & Eggless identity.
>
> **Critical UX decisions:**
> - NO forced login — guests browse menu, add to cart freely. Login only at checkout payment.
> - Promo codes are login-only perks (incentivizes account creation).
> - WhatsApp is the primary communication channel for everything.
> - All orders forwarded to staff WhatsApp automatically.
> - Staff/admin have "Notify Customer" button for manual WhatsApp status updates.
> - Custom Cake orders: form + image upload → sent to staff WhatsApp + stored in admin.
> - Graceful payment status handling (success/fail/pending/timeout all handled).
>
> **Build order:**
> 1. Initialize Next.js project with TypeScript, Tailwind, shadcn/ui (pink theme)
> 2. Set up Prisma schema (from §11, including CustomCakeOrder) and database
> 3. Build auth system (WhatsApp OTP primary, SMS fallback)
> 4. Build admin panel: store settings, category CRUD, product CRUD, asset manager (images+video), hero banner manager
> 5. Build storefront: store selector → home page → menu page → product detail
> 6. Build custom cakes page (form + image upload + WhatsApp submission)
> 7. Build cart (Zustand store, persisted to localStorage for guests) + checkout page
> 8. Integrate Razorpay payments with graceful status handling
> 9. Build order tracking (customer) + order management with "Notify Customer" button (admin/staff)
> 10. Integrate WhatsApp notifications (customer status + staff order forwarding)
> 11. Build promo code engine (login-only, occasion tags, go-live toggle)
> 12. Build remaining pages (about, contact, offers, policies)
> 13. Admin: staff management, reports, customer list
> 14. Polish: responsive design, loading states, error handling, SEO, PWA
> 15. Deploy and test end-to-end
>
> **Key principles:**
> - Mobile-first always — pink/rose-gold theme, clean, modern
> - Progressive Web App — installable, offline menu cache
> - Hindi-friendly (support Devanagari in content, even if UI is English)
> - Owner must be able to manage everything without code changes
> - Staff role from Day 1 (not future) — separate login, order management, notify button
> - Easy extensibility — multi-store, loyalty, subscriptions all possible with current architecture
> - Security first — OWASP compliant, Razorpay signature verification, rate limiting
>
> **Reference:** Theobroma research in `theobroma-research.md` for UX patterns.

---

*End of PRD v1.0 — Ready for owner review.*
