#!/usr/bin/env bash
# Puts Nginx in front of the Next.js app on port 80.
set -euo pipefail
PORT=3005
APP_DIR=/opt/blissbakery-v5

sudo tee /etc/nginx/sites-available/blissbakery-v5 >/dev/null <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 20M;

    # let the app know the original scheme so secure cookies work behind TLS
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection "upgrade";

    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               application/x-javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1024;

    # immutable build output
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3005;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_read_timeout 90s;
    }
}
NGINX

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/blissbakery-v5 /etc/nginx/sites-enabled/blissbakery-v5
sudo nginx -t
sudo systemctl reload nginx
echo "nginx reloaded"

echo "==> local checks"
for p in / /store/kuchaman-city/menu /cakes/birthday /api/health; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost${p}" || echo 000)
  printf '    %-32s %s\n' "$p" "$code"
done
