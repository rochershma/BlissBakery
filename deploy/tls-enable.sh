#!/usr/bin/env bash
# Serve HTTPS on 443. Uses a Let's Encrypt cert when one exists, otherwise a
# self-signed placeholder so the origin is never dark on 443.
set -euo pipefail

DOMAIN="blissbakery.shop"
APP_PORT=3005
SITE=/etc/nginx/sites-available/blissbakery-v5
LE_DIR="/etc/letsencrypt/live/${DOMAIN}"
SS_DIR="/etc/ssl/blissbakery"

if [ -f "${LE_DIR}/fullchain.pem" ]; then
  CERT="${LE_DIR}/fullchain.pem"
  KEY="${LE_DIR}/privkey.pem"
  echo "==> using Let's Encrypt certificate"
else
  echo "==> no LE cert yet, generating self-signed placeholder"
  sudo mkdir -p "$SS_DIR"
  if [ ! -f "${SS_DIR}/origin.crt" ]; then
    sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout "${SS_DIR}/origin.key" -out "${SS_DIR}/origin.crt" \
      -subj "/CN=${DOMAIN}/O=Bliss Bakery" \
      -addext "subjectAltName=DNS:${DOMAIN},DNS:www.${DOMAIN}" 2>/dev/null
  fi
  CERT="${SS_DIR}/origin.crt"
  KEY="${SS_DIR}/origin.key"
fi

# "http2 on;" only exists from nginx 1.25.1; older builds take it on the listen line.
NGX_VER=$(nginx -v 2>&1 | sed 's/.*\///')
if printf '%s\n1.25.1\n' "$NGX_VER" | sort -V -C; then
  LISTEN443="listen 443 ssl http2 default_server;"
  LISTEN443_6="listen [::]:443 ssl http2 default_server;"
  HTTP2_LINE=""
else
  LISTEN443="listen 443 ssl default_server;"
  LISTEN443_6="listen [::]:443 ssl default_server;"
  HTTP2_LINE="http2 on;"
fi
echo "==> nginx ${NGX_VER}"

sudo tee "$SITE" >/dev/null <<EOF
# ---------- shared proxy settings ----------
proxy_set_header Host              \$host;
proxy_set_header X-Real-IP         \$remote_addr;
proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto \$scheme;
proxy_http_version 1.1;
proxy_set_header Upgrade    \$http_upgrade;
proxy_set_header Connection "upgrade";

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${DOMAIN} www.${DOMAIN} _;

    # ACME must stay on plain HTTP for renewals
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
        default_type "text/plain";
        try_files \$uri =404;
    }

    # everything else goes to TLS, except direct-to-IP health checks
    location / {
        if (\$host = _) { proxy_pass http://127.0.0.1:${APP_PORT}; break; }
        return 301 https://\$host\$request_uri;
    }
}

server {
    ${LISTEN443}
    ${LISTEN443_6}
    ${HTTP2_LINE}
    server_name ${DOMAIN} www.${DOMAIN} _;

    ssl_certificate     ${CERT};
    ssl_certificate_key ${KEY};
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;

    client_max_body_size 20M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               application/x-javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1024;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options    "nosniff" always;
    add_header X-Frame-Options           "SAMEORIGIN" always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_read_timeout 90s;
    }
}
EOF

sudo mkdir -p /var/www/html
sudo nginx -t
sudo systemctl reload nginx
echo "==> 443 is live (cert: ${CERT})"
