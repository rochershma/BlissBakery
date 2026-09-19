#!/usr/bin/env bash
# Run AFTER the Cloudflare A record points at this server.
# Swaps the self-signed placeholder for a real Let's Encrypt certificate.
set -euo pipefail

DOMAIN="blissbakery.shop"
EMAIL="${1:-}"

echo "==> checking the domain actually reaches this box"
MYIP=$(curl -s -4 ifconfig.me || true)
echo "    this server: ${MYIP}"
CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "http://${DOMAIN}/api/health" || echo 000)
echo "    http://${DOMAIN}/api/health -> ${CODE}"
if [ "$CODE" != "200" ]; then
  echo
  echo "    NOT REACHABLE YET. In Cloudflare set:"
  echo "      A  @    ${MYIP}   (proxied)"
  echo "      A  www  ${MYIP}   (proxied)"
  echo "    then re-run this script."
  exit 1
fi

echo "==> requesting certificate"
if [ -n "$EMAIL" ]; then
  sudo certbot certonly --webroot -w /var/www/html \
    -d "${DOMAIN}" -d "www.${DOMAIN}" \
    --non-interactive --agree-tos --email "$EMAIL"
else
  sudo certbot certonly --webroot -w /var/www/html \
    -d "${DOMAIN}" -d "www.${DOMAIN}" \
    --non-interactive --agree-tos --register-unsafely-without-email
fi

echo "==> switching nginx to the real certificate"
bash /tmp/tls-enable.sh

echo "==> enabling auto-renewal"
sudo systemctl enable --now certbot.timer
sudo certbot renew --dry-run 2>&1 | tail -3

echo
echo "Done. Now set Cloudflare SSL/TLS mode to 'Full (Strict)'."
