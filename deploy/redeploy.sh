#!/usr/bin/env bash
# Pull the v5 branch, point the app at the public domain, rebuild and restart.
set -euo pipefail

APP_DIR=/opt/blissbakery-v5
DOMAIN="blissbakery.shop"

cd "$APP_DIR"

echo "==> pulling v5"
git fetch origin v5 --quiet
git reset --hard origin/v5 --quiet
git log --oneline -1

echo "==> pointing app at https://${DOMAIN}"
# Only the public URL changes; secrets in .env stay untouched.
sudo sed -i "s#^NEXT_PUBLIC_APP_URL=.*#NEXT_PUBLIC_APP_URL=\"https://${DOMAIN}\"#" .env
grep '^NEXT_PUBLIC_APP_URL' .env

echo "==> installing + building"
# Tailwind/PostCSS are devDependencies and are required by the build.
npm ci --no-audit --no-fund --silent 2>&1 | tail -2
npx prisma generate >/dev/null 2>&1
npm run build 2>&1 | tail -4

echo "==> copying static assets into standalone output"
# Remove first: `cp -r public dest/` nests into dest/public/public when dest exists.
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "==> restarting"
pm2 restart blissbakery-v5 --update-env >/dev/null
sleep 4
pm2 list --no-color | grep blissbakery-v5 || true

echo "==> verifying"
curl -s  -o /dev/null -w 'app  :3005      %{http_code}\n' http://127.0.0.1:3005/
curl -sk -o /dev/null -w 'nginx :443      %{http_code}\n' -H "Host: ${DOMAIN}" https://127.0.0.1/
curl -s  -o /dev/null -w 'nginx :80 -> %{http_code} %{redirect_url}\n' -H "Host: ${DOMAIN}" http://127.0.0.1/
curl -sk -o /dev/null -w 'health         %{http_code}\n' -H "Host: ${DOMAIN}" https://127.0.0.1/api/health
