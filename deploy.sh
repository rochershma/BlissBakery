#!/bin/bash
# =============================================================================
# Bliss Bakery — Server Setup & Deploy Script
# Run as root on a fresh Ubuntu 22.04+ / Debian 12+ server
# Usage: chmod +x deploy.sh && sudo ./deploy.sh
# =============================================================================

set -e

APP_DIR="/opt/blissbakery"
REPO_URL="https://github.com/rochershma/BlissBakery.git"
DOMAIN="${DOMAIN:-}"  # Set via: DOMAIN=blissbakery.in ./deploy.sh
DB_NAME="blissbakery"
DB_USER="blissbakery"
DB_PASS="$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)"
JWT_SECRET="$(openssl rand -base64 32)"
NODE_VERSION="20"

echo "=========================================="
echo "  Bliss Bakery — Server Setup"
echo "=========================================="

# ---- Step 1: System updates ----
echo "[1/8] Updating system packages..."
apt update -y && apt upgrade -y
apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# ---- Step 2: Install Node.js ----
echo "[2/8] Installing Node.js ${NODE_VERSION}..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt install -y nodejs
fi
echo "Node: $(node -v), npm: $(npm -v)"

# ---- Step 3: Install PM2 ----
echo "[3/8] Installing PM2..."
npm install -g pm2

# ---- Step 4: Install MySQL ----
echo "[4/8] Installing MySQL 8.0..."
if ! command -v mysql &> /dev/null; then
  apt install -y mysql-server
  systemctl enable mysql
  systemctl start mysql
fi

# Create database and user
echo "[4/8] Setting up database..."
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
echo "Database '${DB_NAME}' ready. User: ${DB_USER}"

# ---- Step 5: Clone/Pull repo ----
echo "[5/8] Setting up application..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ---- Step 6: Create .env ----
echo "[6/8] Creating environment config..."
cat > "$APP_DIR/.env" <<EOF
# Bliss Bakery — Production Environment
DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"
JWT_SECRET="${JWT_SECRET}"
NODE_ENV=production
NEXT_PUBLIC_APP_NAME="Bliss Bakery"
NEXT_PUBLIC_APP_URL="https://${DOMAIN:-localhost}"
OTP_EXPIRY_MINUTES=5
EOF

echo "Environment file created at $APP_DIR/.env"

# ---- Step 7: Install deps, migrate, build ----
echo "[7/8] Installing dependencies & building..."
cd "$APP_DIR"
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

# ---- Step 8: Start with PM2 ----
echo "[8/8] Starting application with PM2..."
pm2 delete blissbakery 2>/dev/null || true
pm2 start npm --name "blissbakery" -- start
pm2 save
pm2 startup systemd -u root --hp /root

# ---- Nginx reverse proxy ----
echo "Setting up Nginx..."
cat > /etc/nginx/sites-available/blissbakery <<EOF
server {
    listen 80;
    server_name ${DOMAIN:-_};

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/blissbakery /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# ---- Firewall ----
echo "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ---- SSL (if domain is set) ----
if [ -n "$DOMAIN" ]; then
  echo "Setting up SSL for ${DOMAIN}..."
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@${DOMAIN}" || echo "SSL setup failed — set up DNS first, then run: certbot --nginx -d ${DOMAIN}"
fi

# ---- Done ----
echo ""
echo "=========================================="
echo "  DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "  App URL:     http://${DOMAIN:-$(curl -s ifconfig.me)}:3000"
if [ -n "$DOMAIN" ]; then
echo "  Domain:      https://${DOMAIN}"
fi
echo ""
echo "  Database:    ${DB_NAME}"
echo "  DB User:     ${DB_USER}"
echo "  DB Password: ${DB_PASS}"
echo "  JWT Secret:  ${JWT_SECRET}"
echo ""
echo "  PM2 Status:  pm2 status"
echo "  View Logs:   pm2 logs blissbakery"
echo "  Restart:     pm2 restart blissbakery"
echo "  Redeploy:    cd ${APP_DIR} && git pull && npm run build && pm2 restart blissbakery"
echo ""
echo "  SAVE THESE CREDENTIALS SECURELY!"
echo "=========================================="
