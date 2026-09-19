#!/usr/bin/env bash
# Recreate the PM2 process on the standalone server and prove the session
# cookie is marked Secure when the request arrives over HTTPS.
set -euo pipefail

APP_DIR=/opt/blissbakery-v5
DOMAIN="blissbakery.shop"

cd "$APP_DIR"

echo "==> recreating pm2 process on the standalone server"
pm2 delete blissbakery-v5 >/dev/null 2>&1 || true
# next start ignores output:"standalone"; the generated server.js is the real entrypoint.
PORT=3005 HOSTNAME=127.0.0.1 pm2 start .next/standalone/server.js \
  --name blissbakery-v5 --cwd "$APP_DIR" --update-env >/dev/null
pm2 save >/dev/null
sleep 4
pm2 list --no-color | grep blissbakery-v5

echo
echo "==> endpoint checks"
curl -s  -o /dev/null -w 'app   :3005   %{http_code}\n' http://127.0.0.1:3005/
curl -sk -o /dev/null -w 'https :443    %{http_code}\n' -H "Host: ${DOMAIN}" https://127.0.0.1/
curl -sk -o /dev/null -w 'health        %{http_code}\n' -H "Host: ${DOMAIN}" https://127.0.0.1/api/health

echo
echo "==> cookie Secure flag over HTTPS"
printf '{"phone":"9602831559"}' > /tmp/otp.json
curl -sk -o /dev/null -w '  send-otp     %{http_code}\n' \
  -H "Host: ${DOMAIN}" -H 'Content-Type: application/json' \
  --data @/tmp/otp.json https://127.0.0.1/api/auth/send-otp

printf '{"phone":"9602831559","otp":"999999"}' > /tmp/verify.json
echo -n "  https cookie: "
curl -sk -D - -o /dev/null \
  -H "Host: ${DOMAIN}" -H 'Content-Type: application/json' \
  --data @/tmp/verify.json https://127.0.0.1/api/auth/verify-otp \
  | grep -i '^set-cookie' | head -1 | sed 's/^set-cookie: //I' | cut -c1-30 --complement

echo -n "  http  cookie: "
curl -s -D - -o /dev/null \
  -H "Host: ${DOMAIN}" -H 'Content-Type: application/json' \
  --data @/tmp/verify.json http://127.0.0.1:3005/api/auth/verify-otp \
  | grep -i '^set-cookie' | head -1 | sed 's/^set-cookie: //I' | cut -c1-30 --complement

rm -f /tmp/otp.json /tmp/verify.json
echo
echo "==> standalone warning should now be absent:"
pm2 logs blissbakery-v5 --lines 40 --nostream --no-color 2>/dev/null | grep -c 'does not work with' || echo "0 occurrences"
