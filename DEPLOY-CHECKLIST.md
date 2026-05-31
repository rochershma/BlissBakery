# Bliss Bakery — Server Deployment Checklist

Use this checklist when deploying to any new server.

---

## Pre-Deployment Requirements

### 1. Server
- [ ] Ubuntu 22.04+ or Debian 12+
- [ ] Minimum 2 CPU, 2GB RAM
- [ ] Ports 22, 80, 443 open in firewall/security group

### 2. Credentials Needed
- [ ] MySQL root password (or create during setup)
- [ ] JWT_SECRET — generate with: `openssl rand -base64 32`
- [ ] Cloudinary: CLOUD_NAME, API_KEY, API_SECRET (from cloudinary.com dashboard)
- [ ] Domain name (optional, for SSL)

---

## Deployment Steps

### Quick Deploy (single command)
```bash
ssh user@SERVER_IP
curl -fsSL https://raw.githubusercontent.com/rochershma/BlissBakery/main/deploy.sh | sudo bash
```

### Manual Deploy
```bash
# 1. Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# 2. Install MySQL 8.0
sudo apt install -y mysql-server
sudo systemctl enable mysql && sudo systemctl start mysql

# 3. Create DB
sudo mysql -e "CREATE DATABASE blissbakery CHARACTER SET utf8mb4;"
sudo mysql -e "CREATE USER 'blissbakery'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';"
sudo mysql -e "GRANT ALL ON blissbakery.* TO 'blissbakery'@'localhost'; FLUSH PRIVILEGES;"

# 4. Clone repo
git clone https://github.com/rochershma/BlissBakery.git /opt/blissbakery
cd /opt/blissbakery

# 5. Create .env
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# 6. Install, migrate, build
npm ci
npx prisma migrate deploy
npm run build

# 7. Start with PM2
npm install -g pm2
pm2 start npm --name blissbakery --cwd /opt/blissbakery -- start
pm2 save && pm2 startup

# 8. Nginx reverse proxy
# See deploy.sh for full nginx config

# 9. SSL (if domain)
sudo certbot --nginx -d yourdomain.com
```

---

## Environment Variables (.env)

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| DATABASE_URL | ✅ | `mysql://user:pass@localhost:3306/blissbakery` | MySQL connection string |
| JWT_SECRET | ✅ | `openssl rand -base64 32` | MUST be unique per deployment |
| NODE_ENV | ✅ | `production` | |
| NEXT_PUBLIC_APP_URL | ✅ | `http://YOUR_IP` or `https://yourdomain.com` | **MUST match actual protocol** — if HTTP, use `http://`. Cookie `secure` flag depends on this |
| CLOUDINARY_CLOUD_NAME | ✅ | `dvw9o0f8z` | From Cloudinary dashboard |
| CLOUDINARY_API_KEY | ✅ | `792441267859941` | From Cloudinary dashboard |
| CLOUDINARY_API_SECRET | ✅ | `HivYLUr...` | From Cloudinary dashboard |
| OTP_EXPIRY_MINUTES | Optional | `5` | Default 5 minutes |

---

## Post-Deployment Checklist

### Critical Checks
- [ ] Homepage loads: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000` → should be `200`
- [ ] Nginx proxy works: `curl -s -o /dev/null -w '%{http_code}' http://localhost` → should be `200`
- [ ] Login works: Send OTP → Verify → Profile saves
- [ ] Admin panel accessible: `/admin` → login with admin phone
- [ ] Banner add/edit works in admin
- [ ] Product images load from Cloudinary
- [ ] Cart → Checkout flow works

### Data Seeding
```bash
# Import data from export file
npx tsx prisma/import-data.ts

# Or seed fresh data
npx tsx prisma/seed.ts

# Upload local images to Cloudinary
npx tsx prisma/upload-to-cloudinary.ts

# Create test OTPs (for testing without SMS)
npx tsx prisma/create-test-otp.ts
```

### Create Admin User
```bash
npx tsx prisma/add-staff.ts
# Follow prompts to add admin/staff phone numbers
```

---

## Known Issues & Fixes

### 1. "Store not found" on homepage
**Cause:** Homepage was statically generated at build time with empty DB.
**Fix:** Rebuild after importing data: `npm run build && pm2 restart blissbakery`

### 2. Session cookie not working / "Failed to save profile"
**Cause:** `NEXT_PUBLIC_APP_URL` has `https://` but server is HTTP.
**Fix:** Set `NEXT_PUBLIC_APP_URL="http://YOUR_IP"` (match actual protocol), rebuild.

### 3. Banner changes not showing on homepage
**Cause:** Fixed in latest code with `noStore()`. If old build, rebuild.
**Fix:** `npm run build && pm2 restart blissbakery`

### 4. Images loading slowly
**Fix:** Ensure Cloudinary is configured. All images should be `res.cloudinary.com` URLs, not local paths.

### 5. OTP "must be 4 digits" error
**Cause:** Old build has 4-digit validation, new code uses 6-digit.
**Fix:** Ensure latest code is deployed: `git pull && npm run build`

### 6. SSH locked out after deploy.sh
**Cause:** UFW firewall enabled before SSH rule applied.
**Fix:** Use Azure Portal → Run Command to re-enable: `ufw allow 22/tcp && ufw reload`

### 7. PM2 "Cannot find module server.js"
**Cause:** PM2 saved a standalone server.js path but build uses npm start.
**Fix:** `pm2 delete blissbakery && pm2 start npm --name blissbakery --cwd /opt/blissbakery -- start && pm2 save`

### 8. Banner add returns "expected string, received null"
**Cause:** Fixed in latest code. Zod schema now accepts nullable fields.
**Fix:** Deploy latest: `git pull && npm run build && pm2 restart blissbakery`

---

## Useful Commands

```bash
# Check app status
pm2 status
pm2 logs blissbakery --lines 50

# Restart app
pm2 restart blissbakery

# Redeploy after code changes
cd /opt/blissbakery && git pull && npm run build && pm2 restart blissbakery

# Check DB
mysql -u root blissbakery -e 'SELECT COUNT(*) FROM Product;'

# Backup data
cd /opt/blissbakery && npx tsx prisma/export-data.ts

# Check .env
cat /opt/blissbakery/.env

# Check Nginx
nginx -t && systemctl status nginx

# Check MySQL
systemctl status mysql
```

---

## Architecture

```
Client (Browser/Phone)
    ↓ HTTP/HTTPS
Nginx (port 80/443) → reverse proxy
    ↓
Next.js App (PM2, port 3000)
    ↓
MySQL 8.0 (localhost:3306)
    ↓
Cloudinary CDN (images)
```

## Accounts
- Admin: 9602831559 (ADMIN role)
- Staff: 9999999999 (STAFF role)
- Test OTP for both: 999999 (never expires)
