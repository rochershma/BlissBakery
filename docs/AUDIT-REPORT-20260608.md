# Bliss Bakery v2 — Full Product Audit Report
**Date:** 2026-06-08

## Executive Summary
- **Overall health:** Functional with critical pricing gap in order creation
- **Biggest risk:** Custom pricing products charge wrong price at order time (P0)
- **Production readiness:** 85% — needs P0 fix before real orders

---

## P0 — Critical (Revenue / Data Integrity)

### 1. Custom pricing orders charge WRONG price
**File:** `src/app/api/orders/create/route.ts:61`
**Evidence:** Server uses `variant.price` (cheapest flavour) instead of recalculating from customer's selected flavour + weight + design charge.
**Impact:** Revenue loss on every custom-pricing order with non-cheapest flavour. A ₹900 cake could be charged as ₹615.
**Root cause:** Order API doesn't detect `pricingStrategy === "CUSTOM"` and doesn't look up `flavourPrices` or `designCharge`.
**Fix:** Detect custom pricing, look up product's `flavourPrices` and `designCharge`, recalculate: `flavour500g × weightKg × 2 + designCharge`.
**Acceptance:** Order total matches PDP price for any flavour + size combination.

### 2. Cart displays stale prices, checkout total can mismatch server charge
**File:** `src/store/cart.ts`
**Evidence:** Cart stores `unitPrice` at add-time in localStorage, never refreshes from server.
**Impact:** User sees old price in cart/checkout, then gets different charge at order creation. Causes confusion/abandonment.
**Root cause:** Zustand persist store with no server re-verification.
**Fix (recommended):** Re-verify cart prices on checkout page load via API.
**Acceptance:** Checkout always shows server-truth prices.

---

## P1 — High (Functionality)

### 3. Theme admin doesn't revalidate customer pages
**File:** `src/app/admin/themes/page.tsx`
**Evidence:** Only `revalidatePath("/admin/themes")` called.
**Fix:** Add revalidation for `/` and `/store` layout.

### 4. Occasion admin doesn't revalidate `/cakes/*` or `/`
**File:** `src/app/admin/occasions/page.tsx`, `src/app/admin/occasions/[id]/page.tsx`
**Fix:** Add broader revalidation.

### 5. Settings admin doesn't revalidate storefront
**File:** `src/app/admin/settings/page.tsx`
**Evidence:** Delivery charge, packaging, GST changes don't propagate to checkout.
**Fix:** Add revalidation for `/`, `/store`, `/checkout`.

### 6. Banner API routes can't call revalidatePath
**File:** `src/app/api/admin/banners/route.ts`
**Mitigation:** Homepage uses `noStore()` so banners are always fresh. Low risk.

### 7. Cart removeItem removes ALL customizations of same product+variant
**File:** `src/store/cart.ts:75`
**Evidence:** `removeItem` only matches `productId + variantName`, ignoring `flavour`, `cakeMessage`, `occasion`.
**Impact:** If user adds same cake with different messages, removing one removes all.
**Fix:** Use full dedup key including flavour + message.

---

## P2 — Medium (Edge Cases)

### 8. Search shows basePrice — may mislead for custom pricing
**File:** `src/app/api/search/route.ts`
**Note:** Consistent with tiles. Acceptable for now.

### 9. Menu quick-add bypasses flavour selection for custom pricing
**File:** `src/app/store/[slug]/menu/menu-client.tsx:82`
**Note:** Uses `variants[0].price` (cheapest). Consistent with tile. User can change on PDP.

### 10. Hardcoded ₹300 fallback for missing flavour prices
**File:** `src/app/store/[slug]/menu/[productSlug]/product-detail-client.tsx:119`
**Risk:** Could undercharge if flavour has no price entry.
**Fix:** Use `base500gPrice` from product instead of hardcoded 300.

---

## P3 — Polish / Security

### 11. JWT secret has insecure fallback
**File:** `src/middleware.ts` or `src/lib/auth.ts`
**Code:** `process.env.JWT_SECRET || "dev-secret-do-not-use-in-prod"`
**Risk:** If env var missing, anyone can forge admin tokens.
**Fix:** Throw error if JWT_SECRET not set in production.

### 12. Promo `validFrom` not enforced at order time
**File:** `src/app/api/orders/create/route.ts:86`
**Risk:** Future-dated promos can be used early.
**Fix:** Add `validFrom` check.

---

## What's Working Well

| Area | Status |
|------|--------|
| Admin route protection (middleware + requireAdmin) | ✅ Solid |
| Server-side price verification (partial) | ✅ Good for Fixed pricing |
| noStore() on all customer pages | ✅ Fixed this session |
| revalidatePath on product CRUD | ✅ Fixed this session |
| basePrice synced to cheapest variant | ✅ Fixed this session |
| Cloudinary CDN image loader | ✅ Working |
| Loading skeletons (5 routes) | ✅ Working |
| Button pending states (all async) | ✅ Working |
| GST bug (|| vs ??) | ✅ Fixed |
| Delivery fee distance-based | ✅ Working |
| Admin delivery config | ✅ Working |
| Custom pricing formula | ✅ Working on PDP |
| Profile drawer | ✅ Fixed (z-index + click handler) |

---

## Recommended Fix Plan

### Phase 1 — P0 (Do immediately)
1. Fix order API to recalculate custom pricing from flavour + weight + design charge
2. Add cart price re-verification on checkout page load

### Phase 2 — P1 (Do this week)
3. Fix cart removeItem to use full dedup key
4. Add revalidation to theme/occasion/settings/banner admin actions
5. Use product `base500gPrice` instead of hardcoded 300 fallback

### Phase 3 — P3 (When convenient)
6. Enforce JWT_SECRET requirement
7. Add promo `validFrom` check
8. Add cart price refresh indicator when prices changed
