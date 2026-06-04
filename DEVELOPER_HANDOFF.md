# Bliss Bakery — Developer Handoff & Operations Guide

## Quick Reference

| Item | Value |
|------|-------|
| **Production URL** | `http://20.221.129.132/` |
| **Server** | Azure VM (Ubuntu), IP: `20.221.129.132` |
| **SSH** | `ssh -i testlmsk_key.pem azureuser@20.221.129.132` |
| **SSH Key** | `$env:USERPROFILE\Downloads\testlmsk_key.pem` |
| **App Directory (prod)** | `/opt/blissbakery/` |
| **App Directory (local)** | `q:\src\poc\bakes\blissbakery` |
| **Process Manager** | PM2 (`sudo pm2 restart blissbakery`) |
| **Framework** | Next.js 16.2.7 (Turbopack), TypeScript, React 19 |
| **Database** | MySQL on same VM, Prisma ORM v6 |
| **DB Credentials (prod)** | `mysql -u blissbakery -pKANcMkVj2dpi1pfvY2EM blissbakery` |
| **DB Credentials (local)** | `mysql://root:root@localhost:3306/blissbakery` |
| **CDN** | Cloudinary (`dvw9o0f8z`, key: `792441267859941`) |
| **Store ID** | `cmpjy28850000zh6sriwxlpjp` |
| **Test Login** | Phone: `9602831559`, OTP: `999999` |
| **Current Branch** | `main` |
| **Current Commit** | `82b669e` |

---

## Build & Deploy Process

### 1. Local Build (validate before deploy)
```powershell
cd q:\src\poc\bakes\blissbakery
npx next build
```
Build succeeds → no errors in last 5 lines.

### 2. Git Commit
```powershell
git add -A
git commit -m "description of changes"
```

### 3. Deploy to Production (one-liner)
```powershell
# Copy files to staging
scp -o StrictHostKeyChecking=no -i "$env:USERPROFILE\Downloads\testlmsk_key.pem" -r src azureuser@20.221.129.132:/tmp/blissbakery-deploy/

# Copy to prod, build, restart
ssh -o StrictHostKeyChecking=no -i "$env:USERPROFILE\Downloads\testlmsk_key.pem" azureuser@20.221.129.132 'sudo cp -r /tmp/blissbakery-deploy/src /opt/blissbakery/ && cd /opt/blissbakery && sudo npx next build 2>&1 | tail -3 && sudo pm2 restart blissbakery 2>&1 | grep online'
```

### 4. Full Deploy (including prisma/package.json changes)
```powershell
scp -o StrictHostKeyChecking=no -i "$env:USERPROFILE\Downloads\testlmsk_key.pem" -r src prisma package.json next.config.ts postcss.config.mjs tsconfig.json azureuser@20.221.129.132:/tmp/blissbakery-deploy/

ssh -o StrictHostKeyChecking=no -i "$env:USERPROFILE\Downloads\testlmsk_key.pem" azureuser@20.221.129.132 'sudo cp -r /tmp/blissbakery-deploy/src /opt/blissbakery/ && sudo cp -r /tmp/blissbakery-deploy/prisma /opt/blissbakery/ && sudo cp /tmp/blissbakery-deploy/package.json /opt/blissbakery/ && cd /opt/blissbakery && sudo npx next build 2>&1 | tail -3 && sudo pm2 restart blissbakery 2>&1 | grep online'
```

### 5. Verify Deployment
```powershell
curl.exe -s -o /dev/null -w "%{http_code}" "http://20.221.129.132/"
# Should return: 200
```

---

## Git Tags & Rollback Points

| Tag | Commit | Description |
|-----|--------|-------------|
| `pre-homepage-redesign` | `f69cdef` | Last stable state before homepage redesign attempts. All Phase 1+2 features working. |

### How to Rollback
```powershell
# Rollback specific files
git checkout pre-homepage-redesign -- src/app/page.tsx src/components/home/hero-slider.tsx src/app/globals.css

# Or rollback everything
git checkout pre-homepage-redesign

# Then deploy
```

---

## Key Commit History (chronological)

### Baseline & Phase 1
| Commit | Description |
|--------|-------------|
| `52a51da` | Baseline: pre-phase1 state |
| `ae05749` | Phase 1: eggless badge, % OFF, earliest delivery, image lightbox, search, addons upsell |
| `76598b1` | Premium add-to-cart flow with upsell modal, admin add-ons with image upload |
| `1e79690` | Fix: add 'addons' to allowed upload folders whitelist |
| `763e582` | Premium cart redesign with addon chips, full-page upsell modal |

### Phase 2 & UX Fixes
| Commit | Description |
|--------|-------------|
| `91b0e58` | Sort options + filter drawer (later reverted) |
| `ebcb8ca` | Revert: remove sort/filter from menu page |
| `0c742fe` | Theme: peony pink color palette |
| `168cacd` | Swipeable product card images + asset delete |
| `e5f6a09` | Asset delete visible, menu upsell modal, PDP swipe gallery |
| `01df688` | Pinch-to-zoom lightbox, upsell checkout button |
| `06bc3ac` | FlowerAura-style hover lens zoom on desktop |
| `428b08b` | Cart/checkout proper price separation, addon rows |
| `311bf50` | Real add-on images from admin in cart/checkout |
| `1199443` | Modern form elements - pill date/time pickers |
| `df9fcb5` | Modern address cards + clean time slots |
| `918e7bf` | Order images+links in admin, maps pickup, lat/lng settings |
| `dcebfc8` | 28 flavours, 0.5-6kg sizes, occasion dropdown, 2hr buffer |
| `19aae70` | Occasion breadcrumb links, side-by-side flavour+occasion dropdowns |
| `f69cdef` | **TAG: pre-homepage-redesign** — stable checkpoint |

### Homepage Redesign (reverted)
| Commit | Description |
|--------|-------------|
| `402ecf9` → `ededc60` | Multiple homepage redesign attempts — hero broke |
| `82b669e` | **Revert to pre-redesign** — hero working again |

---

## Server Architecture

```
Azure VM (20.221.129.132)
├── /opt/blissbakery/          # Production app
│   ├── src/                   # Next.js source
│   ├── prisma/                # Schema + migrations
│   ├── .next/                 # Build output
│   ├── node_modules/          # Dependencies
│   ├── .env                   # Environment variables
│   └── public/                # Static assets
├── PM2 process: blissbakery   # Node.js process manager
├── MySQL (localhost:3306)     # Database
│   └── blissbakery DB
└── Nginx (port 80 → 3000)    # Reverse proxy
```

### PM2 Commands
```bash
sudo pm2 restart blissbakery   # Restart app
sudo pm2 status blissbakery    # Check status
sudo pm2 logs blissbakery --lines 20  # View logs
sudo pm2 stop blissbakery      # Stop app
```

### Database Commands
```bash
# Connect to DB
mysql -u blissbakery -pKANcMkVj2dpi1pfvY2EM blissbakery

# Backup DB
mysqldump -u blissbakery -pKANcMkVj2dpi1pfvY2EM blissbakery > backup_$(date +%Y%m%d).sql

# Run Prisma migration
cd /opt/blissbakery && npx prisma migrate deploy

# Generate Prisma client
cd /opt/blissbakery && npx prisma generate
```

---

## Authentication

### Get Auth Cookie (for API testing)
```powershell
$r1 = Invoke-WebRequest -Uri "http://20.221.129.132/api/auth/send-otp" -Method POST -ContentType "application/json" -Body '{"phone":"9602831559","method":"whatsapp"}' -SessionVariable sess
$r2 = Invoke-WebRequest -Uri "http://20.221.129.132/api/auth/verify-otp" -Method POST -ContentType "application/json" -Body '{"phone":"9602831559","otp":"999999"}' -WebSession $sess
$ck = ($sess.Cookies.GetCookies("http://20.221.129.132") | Where-Object { $_.Name -eq "bb-session" }).Value
```

### Use Cookie with curl
```powershell
curl.exe -s -H "Cookie: bb-session=$ck" "http://20.221.129.132/api/admin/addons"
```

---

## Cloudinary CDN

| Setting | Value |
|---------|-------|
| Cloud Name | `dvw9o0f8z` |
| API Key | `792441267859941` |
| API Secret | `HivYLUr0PPu1F7XTCyU8Jwn3qgA` |
| Upload Folders | `products`, `banners`, `categories`, `occasions`, `assets`, `addons` |
| Upload API | `POST /api/admin/upload` (requires auth) |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Homepage |
| `src/app/store/[slug]/menu/page.tsx` | Menu listing page |
| `src/app/store/[slug]/menu/menu-client.tsx` | Menu client component (search, cards, add-to-cart) |
| `src/app/store/[slug]/menu/[productSlug]/page.tsx` | Product detail page (server) |
| `src/app/store/[slug]/menu/[productSlug]/product-detail-client.tsx` | PDP client (variants, flavours, occasions, cart) |
| `src/app/cart/page.tsx` | Cart page |
| `src/app/checkout/page.tsx` | Checkout page |
| `src/app/admin/` | Admin panel (orders, menu, banners, settings, add-ons) |
| `src/components/home/hero-slider.tsx` | Hero banner slider (Swiper) |
| `src/components/product/image-gallery.tsx` | PDP image gallery (hover zoom, swipe, lightbox) |
| `src/components/product/addons-upsell-modal.tsx` | Add-ons upsell after add-to-cart |
| `src/components/shared/site-header.tsx` | Header with search, cart, profile |
| `src/components/shared/search-overlay.tsx` | Search modal |
| `src/store/cart.ts` | Zustand cart store |
| `src/app/globals.css` | Theme variables, animations, form styles |
| `prisma/schema.prisma` | Database schema |

---

## Current Theme (Peony Pink)

```css
--background: #F7E1E3;
--foreground: #2A1F22;
--primary: #C47590;
--primary-hover: #B3657F;
--primary-light: #F2D4DA;
--secondary: #CD8EA1;
--accent: #922D4D;
--muted: #F0D5D9;
--muted-foreground: #7A5060;
--card: #FFF7F8;
--border: #E4C4CB;
--dark-bg: #2A1F22;
```

---

## Known Issues / Pending Work

1. **Homepage redesign** — attempted but hero banner broke with rounded corners + Swiper. Reverted to pre-redesign. The `.md` report and HTML mockup at `q:\src\poc\bakes\bliss-bakery-ui-ux-speed-report.md` and `bliss-bakery-premium-home-mockup.html` contain the full design spec.
2. **Sort/Filter on menu** — was built and worked but user didn't like the look, reverted.
3. **Customer reviews** — not implemented yet (Phase 2 item).
4. **Maps-based address** — not implemented, currently pincode-based validation.
5. **Time slot buffer** — currently 2 hours, should be admin-configurable via settings.

---

## Admin Features

| Feature | URL | Description |
|---------|-----|-------------|
| Dashboard | `/admin` | Order stats overview |
| Orders | `/admin/orders` | View/manage orders with product images |
| Menu | `/admin/menu` | Products CRUD with variants, flavours, images |
| Banners | `/admin/banners` | Hero banner management |
| Occasions | `/admin/occasions` | Occasion categories with recipients |
| Promos | `/admin/promos` | Promo codes management |
| Add-Ons | `/admin/add-ons` | Store add-ons with image upload, edit, delete |
| Customers | `/admin/customers` | Customer list |
| Assets | `/admin/assets` | Media library with upload and delete |
| Settings | `/admin/settings` | Store config, hours, delivery, GST, lat/lng |
