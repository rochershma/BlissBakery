#!/usr/bin/env bash
# Pull the v5 branch, point the app at the public domain, rebuild and restart.
set -euo pipefail

APP_DIR=/opt/blissbakery-v5
DOMAIN="blissbakery.shop"

# Everything lives inside main() on purpose. Bash reads a script incrementally,
# and the `git reset --hard` below rewrites this very file — without the
# wrapper bash would carry on reading the *new* bytes at the old offset and
# silently skip steps. Defining a function forces the whole body to be parsed
# before a single line of it runs.
main() {
  cd "$APP_DIR"

  echo "==> pulling v5"
  git fetch origin v5 --quiet
  git reset --hard origin/v5 --quiet
  git log --oneline -1

  echo "==> pointing app at https://${DOMAIN}"
  # Only the public URL changes; secrets in .env stay untouched.
  sudo sed -i "s#^NEXT_PUBLIC_APP_URL=.*#NEXT_PUBLIC_APP_URL=\"https://${DOMAIN}\"#" .env
  grep '^NEXT_PUBLIC_APP_URL' .env

  echo "==> installing"
  # Tailwind/PostCSS are devDependencies and are required by the build.
  npm ci --no-audit --no-fund --silent 2>&1 | tail -2
  npx prisma generate >/dev/null 2>&1

  echo "==> syncing database schema"
  # Back up first: a schema change is the one step that can lose data.
  bash deploy/backup.sh 2>&1 | tail -2
  # No --accept-data-loss: push aborts rather than dropping anything.
  npx prisma db push --skip-generate 2>&1 | tail -3

  echo "==> building"
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
}

main "$@"
