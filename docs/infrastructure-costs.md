# Bliss Bakery — Infrastructure & Cost Estimation

## 1. CDN: Cloudflare vs Cloudinary

| | Cloudflare (Free) | Cloudinary (Free) |
|---|---|---|
| **Purpose** | CDN for entire site (JS/CSS/HTML/images) + SSL + DDoS | Image/video CDN only |
| **Free tier** | Unlimited bandwidth, unlimited requests | 25K transforms/month, 25GB bandwidth, 25GB storage |
| **HTTPS** | Free SSL certificate | N/A (not a website CDN) |
| **JS/CSS caching** | Yes — global edge | No |
| **Image optimization** | Basic (Polish on Pro plan) | Excellent — resize, format, crop |
| **HTTP/2 + HTTP/3** | Yes | N/A |
| **DDoS protection** | Yes | No |
| **Domain required** | Yes | No |
| **PWA install** | Enables it (HTTPS) | Doesn't help |

**Verdict: Use BOTH.** Cloudflare for site CDN + SSL. Cloudinary for image transformations. Both free tiers are more than enough for a single-town bakery.

---

## 2. Hosting Comparison

| Provider | Plan | Cost/month | RAM | CPU | Storage | Free Domain | Notes |
|----------|------|-----------|-----|-----|---------|-------------|-------|
| **Current Azure VM** | B1s | ~₹750 | 1GB | 1 vCPU | 30GB | No | Already running |
| **Railway** | Hobby | $5 (₹420) | 512MB | Shared | 1GB | No | Auto-deploy from Git, includes DB |
| **Render** | Free → Starter $7 | ₹0-590 | 512MB | Shared | Free DB 256MB | No | Free tier sleeps after 15min |
| **Vercel** | Hobby | ₹0 | Serverless | Auto | N/A | No | Best for Next.js, free tier generous |
| **DigitalOcean** | Basic | $6 (₹500) | 1GB | 1 vCPU | 25GB | No | $200 free credit for 60 days |
| **Hetzner** | CAX11 | €3.79 (₹350) | 4GB | 2 ARM vCPU | 40GB | No | Best value, EU/US only |
| **Hostinger VPS** | KVM 1 | ₹499 | 4GB | 1 vCPU | 50GB | **Free .com domain** | India DC available |
| **Coolify** (self-hosted) | On any VPS | ₹0 (VPS cost only) | N/A | N/A | N/A | No | Open-source Vercel alternative |

### Best Picks

| Option | Monthly Cost | Why |
|--------|-------------|-----|
| **Stay on Azure** + add Cloudflare | ₹750 + domain ₹50/mo | Least effort, just add domain + Cloudflare |
| **Vercel Free** + PlanetScale/Neon DB | ₹0 | Zero cost, best Next.js performance, auto-scaling |
| **Hostinger VPS** + Cloudflare | ₹499 + ₹0 | Free domain included, 4GB RAM (4x current), India DC |

---

## 3. Domain Cost

| Provider | .com | .in | Free with hosting? |
|----------|------|-----|-------------------|
| **Hostinger** | ₹699/yr (1st year free with VPS) | ₹499/yr | **Yes — free .com with VPS plan** |
| **GoDaddy** | ₹599/yr (1st year ₹99) | ₹349/yr | No |
| **Namecheap** | ₹800/yr | ₹500/yr | No |
| **Cloudflare Registrar** | ~₹750/yr (at-cost, no markup) | N/A | No, but cheapest renewal |

---

## 4. WhatsApp / SMS OTP

| Provider | Free Tier | Paid Rate | WhatsApp | SMS |
|----------|-----------|-----------|----------|-----|
| **Firebase Phone Auth** | 10,000 verifications/month FREE | ₹0.06/verification after | No (SMS only) | Yes |
| **MSG91** | 5000 SMS free | ₹0.15/SMS, ₹0.30/WhatsApp | Yes | Yes |
| **2Factor.in** | 500 OTP free | ₹0.18/SMS | No | Yes |
| **Twilio** | $15 credit (~150 SMS) | ₹0.30/SMS India, ₹0.50/WhatsApp | Yes | Yes |
| **Gupshup** | Trial credits | ₹0.25/WhatsApp | Yes | Yes |
| **WhatsApp Business API** (Meta) | 1000 free conversations/month | ₹0.30-0.50/conversation | Yes | No |

### Best Pick for Bakery (~100 orders/day = ~3000 OTPs/month)

- **Firebase Phone Auth** — 10K free OTPs/month. Zero cost. SMS only.
- **MSG91** — if WhatsApp OTP needed. 5K free SMS, then ₹0.15/SMS.

---

## 5. Payment Aggregator

| Provider | Setup Fee | MDR (commission) | Settlement | UPI | Cards | Notes |
|----------|-----------|-------------------|------------|-----|-------|-------|
| **Razorpay** | ₹0 | 2% (cards), 0% (UPI ≤₹2000) | T+2 | Yes | Yes | Most popular, easy Next.js SDK |
| **Cashfree** | ₹0 | 1.95% (cards), 0% (UPI) | T+1 (next day!) | Yes | Yes | Faster settlement |
| **PayU** | ₹0 | 2% (cards), 0% (UPI) | T+2 | Yes | Yes | Older, reliable |
| **PhonePe PG** | ₹0 | 0% (UPI), 1.95% (cards) | T+1 | Yes | Yes | Good UPI adoption |
| **Stripe India** | ₹0 | 2% (cards), 0% (UPI) | T+2 | Yes | Yes | Best docs, international |
| **Paytm PG** | ₹0 | 1.99% (cards), 0% (UPI) | T+1 | Yes | Yes | High wallet adoption |
| **COD** | ₹0 | 0% | Instant | N/A | N/A | No integration needed |

### Cost for 100 orders/day at avg ₹700

- UPI (90%): ₹0 commission
- Cards (10%): 7 orders × ₹700 × 2% = ₹98/day = **~₹3,000/month**

---

## 6. Total Monthly Cost — Three Options

### Option A: Cheapest (₹~3,030/month)

| Item | Cost |
|------|------|
| Vercel Free (hosting) | ₹0 |
| Neon Free (database) | ₹0 |
| Cloudflare Free (CDN + SSL) | ₹0 |
| Cloudinary Free (images) | ₹0 |
| Firebase Auth (OTP) | ₹0 |
| Domain (.in from GoDaddy) | ₹30/mo (~₹349/yr) |
| Razorpay (UPI free, cards 2%) | ~₹3,000/mo |
| **Total** | **₹3,030/month** |

### Option B: Current Setup + Cloudflare (₹~3,800/month)

| Item | Cost |
|------|------|
| Azure VM (current) | ₹750 |
| Cloudflare Free | ₹0 |
| Cloudinary Free | ₹0 |
| Domain (.com) | ₹50/mo (~₹599/yr) |
| Firebase Auth (OTP) | ₹0 |
| Razorpay | ~₹3,000/mo |
| **Total** | **₹3,800/month** |

### Option C: Best Value (₹~3,500/month)

| Item | Cost |
|------|------|
| Hostinger VPS 4GB | ₹499 |
| Free .com domain (included) | ₹0 |
| Cloudflare Free | ₹0 |
| Cloudinary Free | ₹0 |
| Firebase Auth | ₹0 |
| Razorpay | ~₹3,000/mo |
| **Total** | **₹3,499/month** |

---

## 7. Recommended Action Plan

### Immediate (this week)
- Buy domain (₹99 from GoDaddy first year)
- Add to Cloudflare Free → get HTTPS + CDN + PWA install
- Keep Azure VM
- **Cost: ₹99 one-time**

### Next month
- Integrate Razorpay (UPI free) + Firebase Phone Auth (10K OTPs free)
- **Cost: ₹0**

### When scaling
- Move to Hostinger VPS (₹499/mo, 4GB RAM, free domain) or Vercel Free
