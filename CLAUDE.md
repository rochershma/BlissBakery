@AGENTS.md

# Bliss Bakery — Strict Development Guidelines

## MANDATORY: PRE-CHANGE RULES
1. **Read before edit** — Read the FULL file before modifying it. Understand every function.
2. **Check schema first** — Before touching any API or DB query, verify fields in `prisma/schema.prisma`
3. **JSON string fields** — `Product.images`, `Product.occasions`, `Product.forWhom`, `OrderItem.addOns` are `String @db.Text` stored as JSON. ALWAYS use `JSON.parse()` — they are NOT arrays.
4. **Never remove existing fields** from API responses or interfaces without explicit approval.
5. **Never modify working code paths** unless directly required by the task.

## MANDATORY: PRE-COMMIT CHECKLIST (Do ALL before every commit)
1. `npx next build` — must pass with ZERO errors
2. `git diff` — read EVERY changed line, verify:
   - No removed imports that are still used
   - No missing closing braces or extra braces
   - No dropped API response fields
   - No hardcoded localhost/dev URLs
   - No `.env` values or secrets
3. Verify no regression in known fragile areas (see below)

## MANDATORY: PRE-DEPLOY CHECKLIST (Do ALL before every deploy)
1. Local build passed (above)
2. `git diff HEAD~1 --stat` — review scope of what's being deployed
3. Server deploy command must include build verification — if build fails on server, DO NOT restart PM2.
4. After deploy: verify the changed page/API on http://20.221.129.132

## KNOWN FRAGILE AREAS — DO NOT REGRESS
| Area | Critical Detail |
|------|----------------|
| `/api/orders/create` | Zod `.min(1)` on items array, `.max(50)` on qty, name XSS strip via `.transform()` |
| `/api/admin/banners` (POST+PUT) | Title HTML sanitization (`<tags>` stripped) in both create and update |
| `/api/orders` (GET) | `product.images` is JSON string — must `JSON.parse()` before accessing |
| `/profile` page | Full account hub: orders, addresses, offers, admin link, logout |
| `/orders` page | Product images, bill breakdown, expandable details |
| Category admin pages | `image` field must be read AND saved in both new and edit |
| `createOtpSession` | Must preserve permanent test OTPs (expiresAt > 2098) |
| `verifyOtp` | Must skip marking permanent test OTPs as verified |
| `hero-slider.tsx` | Designed banner detection via `cloudinary` or `bakingo-` in URL |
| `mobile-bottom-nav.tsx` | Hidden on admin/cart/checkout; menu → `/store/kuchaman-city/menu` |
| Homepage `page.tsx` | `noStore()` for dynamic rendering — do not remove |
| Cookie secure flag | Based on `NEXT_PUBLIC_APP_URL.startsWith("https")`, NOT NODE_ENV |
| Order price | Server-side lookup from DB — never trust client `unitPrice` |

## CODE CONVENTIONS
- **Fonts**: `font-serif` (Playfair Display) for headings, `font-sans` (Inter) for body, `font-mono` for codes
- **Formatting**: `formatPrice()` for all currency display
- **Components**: Server components = no onClick/useState. Client = `"use client"` directive.
- **Images**: `object-cover`, always provide `alt` and `sizes` props on `next/Image`
- **Cards**: `rounded-xl` or `rounded-2xl`
- **Colors**: Primary gold `#C8A27C`, Secondary pink `#D4A0A0`, Background `#FDF0EB`
- **Uploads**: Cloudinary when configured, local `/uploads/` fallback

## DATABASE
- Provider: MySQL 8.0 (NOT SQLite)
- After schema changes: `npx prisma generate` (kill dev server first)
- Migrations: `npx prisma migrate dev` (local), `npx prisma migrate deploy` (prod)

## DEPLOYMENT
- Server: Azure VM `20.221.129.132`, user `azureuser`
- Process: PM2 (`blissbakery`), Nginx reverse proxy
- GitHub: `https://github.com/rochershma/BlissBakery.git` (private)
- Test OTPs: 9602831559→999999, 7073766728→999999 (permanent, never expire)
