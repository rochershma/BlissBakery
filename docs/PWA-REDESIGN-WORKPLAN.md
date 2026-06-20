# PWA Redesign Work Plan — 2026-06-20

## Backup Information
- **Backup Branch**: `backup/bliss-current-before-pwa-redesign`
- **Backup Tag**: `bliss-current-before-pwa-redesign`
- **Date**: 2026-06-20
- **Last Commit**: `b569fac` (backup: production DB snapshot 2026-06-20)
- **DB Snapshot**: `backups/backup_production_20260620.sql`

## How to Rollback
```bash
git checkout backup/bliss-current-before-pwa-redesign
# or
git reset --hard bliss-current-before-pwa-redesign
```

## Current Deployed App State (Confirmed Working)
- Login with OTP (9602831559 / 999999)
- Profile page after login
- Search overlay with real products
- Product detail pages with customization
- Add to cart with upsell modal
- Cart with quantity controls, bill details
- Checkout with pickup/delivery, addresses, time slots, promo codes
- Admin panel at /admin
- PWA: manifest, service worker, install prompt, standalone mode
- ISR caching on catalog pages
- SSR on search, checkout, admin

## Known Issues to Fix
1. Bottom nav Menu `/store/kuchaman-city/menu` shows "No products found"
2. Checkout sticky payment bar overlaps time slots on mobile
3. App feels like responsive website, not native PWA

## Commit Log (Pre-Redesign)
```
b569fac backup: production DB snapshot 2026-06-20
f19ba66 perf: switch catalog pages to ISR, keep search/checkout/admin as SSR
8648b92 fix: remove duplicate code in search route
e46fdbf fix: search relevance scoring
289a0f3 fix: remove duplicate catch block causing build failure
```

## Redesign Phases

### Phase 1: Fix Menu Bug
- Root cause: Menu page loads products through store→categories→products
- If store's categories have no isAvailable products, shows empty
- Fix: Also fetch products globally (like homepage does) or fix data relationship

### Phase 2: App Shell & Bottom Nav
- Compact sticky header (logo + location + search bar)
- Redesigned bottom nav (Home, Menu, Search, Cart, Account)
- Safe-area padding
- Remove desktop-web feel on mobile

### Phase 3: Home Screen
- Premium hero card (pink/cream gradient, NOT dark)
- Category grid (3-col thumbnails)
- Occasions section (2-col cards)
- Themes section
- Bestseller carousel
- Trust signals section

### Phase 4: Menu Screen (Split Layout)
- Left rail: category thumbnails (28% width)
- Right panel: product feed (72%)
- Sticky category title
- Accordion sub-categories for occasions/themes
- Real data from backend

### Phase 5: Search Overlay
- Full-screen overlay
- Popular chips
- Instant results with thumbnails
- Clear button
- Premium styling

### Phase 6: Product Detail
- Large hero image
- Eggless/Fresh badge
- Step-based customization cards
- Sticky "Add to Cart" bar
- Related products

### Phase 7: Cart
- Premium basket styling
- Item cards with image
- Extras/gifts section
- Bill details
- Sticky checkout bar with safe-area

### Phase 8: Checkout
- Fix sticky bar overlap
- Premium card-based sections
- Better time slot tapping
- App-like flow

### Phase 9: Profile & Orders
- App-style account tab
- Order tracking timeline
- Reorder CTA

### Phase 10: PWA Polish
- Verify manifest, SW, icons
- Skeleton loading states
- Theme color consistency
- Offline fallback
- Final validation

## Design Tokens (Keep Existing)
- Primary: #C47590
- Background: soft pink/blush gradient
- Card: #FFF7F8
- Foreground: #27191d
- Font serif: Playfair Display
- Font sans: Inter
- Border radius: premium (2xl, xl)
