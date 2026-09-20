#!/usr/bin/env bash
# Log the server port on every request so we can tell 80 from 443 in the access
# log, and let port 80 serve the app directly (needed for Cloudflare "Flexible"
# and for ACME) instead of blindly redirecting.
set -euo pipefail

DOMAIN="blissbakery.shop"
APP_PORT=3005
SITE=/etc/nginx/sites-available/blissbakery-v5
LE_DIR="/etc/letsencrypt/live/${DOMAIN}"
SS_DIR="/etc/ssl/blissbakery"

if [ -f "${LE_DIR}/fullchain.pem" ]; then
  CERT="${LE_DIR}/fullchain.pem"; KEY="${LE_DIR}/privkey.pem"
else
  CERT="${SS_DIR}/origin.crt";    KEY="${SS_DIR}/origin.key"
fi

NGX_VER=$(nginx -v 2>&1 | sed 's/.*\///')
if printf '%s\n1.25.1\n' "$NGX_VER" | sort -V -C; then
  L443="listen 443 ssl http2 default_server;"; L443_6="listen [::]:443 ssl http2 default_server;"; H2=""
else
  L443="listen 443 ssl default_server;";       L443_6="listen [::]:443 ssl default_server;";       H2="http2 on;"
fi

sudo tee /etc/nginx/conf.d/logfmt.conf >/dev/null <<'EOF'
log_format withport '$remote_addr:$server_port - [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_user_agent"';
EOF

sudo tee "$SITE" >/dev/null <<EOF
proxy_set_header Host              \$host;
proxy_set_header X-Real-IP         \$remote_addr;
proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
# Cloudflare tells us the visitor's original scheme; fall back to ours.
proxy_set_header X-Forwarded-Proto \$cf_or_scheme;
proxy_http_version 1.1;
proxy_set_header Upgrade    \$http_upgrade;
proxy_set_header Connection "upgrade";

map \$http_cf_visitor \$cf_or_scheme {
    default   \$scheme;
    "~\"https\"" https;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${DOMAIN} www.${DOMAIN} _;
    access_log /var/log/nginx/access.log withport;

    client_max_body_size 20M;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
        default_type "text/plain";
        try_files \$uri =404;
    }

    # Serve the app on 80 as well. Cloudflare terminates TLS at the edge, so a
    # blanket redirect here breaks "Flexible" mode with a loop.
    location /_next/static/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_read_timeout 90s;
    }
}

server {
    ${L443}
    ${L443_6}
    ${H2}
    server_name ${DOMAIN} www.${DOMAIN} _;
    access_log /var/log/nginx/access.log withport;

    ssl_certificate     ${CERT};
    ssl_certificate_key ${KEY};
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;

    client_max_body_size 20M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               application/x-javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1024;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
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
echo "==> nginx reloaded (cert: ${CERT})"
