#!/usr/bin/env bash
# Build and restart from whatever code is currently on disk.
# Used when the GitHub push path is unavailable and files were copied directly.
set -euo pipefail

APP_DIR=/opt/blissbakery-v5
cd "$APP_DIR"

echo "==> building"
npx prisma generate >/dev/null 2>&1
npm run build 2>&1 | tail -4

echo "==> syncing static assets into standalone output"
# Remove first: `cp -r public dest/` nests into dest/public/public when dest exists.
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "==> restarting"
pm2 restart blissbakery-v5 --update-env >/dev/null
pm2 save >/dev/null
sleep 4

echo "==> verifying"
curl -s  -o /dev/null -w '  app   :3005   %{http_code}\n' http://127.0.0.1:3005/
curl -sk -o /dev/null -w '  https :443    %{http_code}\n' -H 'Host: blissbakery.shop' https://127.0.0.1/
curl -sk -o /dev/null -w '  health        %{http_code}\n' -H 'Host: blissbakery.shop' https://127.0.0.1/api/health
curl -sk -o /dev/null -w '  favicon.ico   %{http_code}\n' -H 'Host: blissbakery.shop' https://127.0.0.1/favicon.ico
curl -sk -o /dev/null -w '  icon-192      %{http_code}\n' -H 'Host: blissbakery.shop' https://127.0.0.1/icons/icon-192.png
