#!/usr/bin/env bash
# Deploys the v5 branch to /opt/blissbakery-v5 and (re)starts it under PM2.
# Expects /tmp/.env.server (non-DB secrets) to already be uploaded.
set -euo pipefail

APP_DIR=/opt/blissbakery-v5
REPO=https://github.com/rochershma/BlissBakery.git
BRANCH=v5
DB_NAME=blissbakery_v5
DB_USER=blissbakery
PM2_NAME=blissbakery-v5
PORT=3005

echo "==> fetch source (branch ${BRANCH})"
sudo mkdir -p "${APP_DIR}"
sudo chown -R "$USER":"$USER" "${APP_DIR}"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" fetch --depth 1 origin "${BRANCH}"
  git -C "${APP_DIR}" reset --hard "origin/${BRANCH}"
  git -C "${APP_DIR}" clean -fd -e .env -e node_modules -e .next
else
  # /opt is root-owned, so empty the directory rather than removing it
  find "${APP_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  git clone --depth 1 --branch "${BRANCH}" "${REPO}" "${APP_DIR}/src-tmp"
  mv "${APP_DIR}/src-tmp"/* "${APP_DIR}/src-tmp"/.[!.]* "${APP_DIR}/" 2>/dev/null || true
  rmdir "${APP_DIR}/src-tmp"
fi
echo "    at $(git -C "${APP_DIR}" rev-parse --short HEAD)"

cd "${APP_DIR}"

echo "==> .env"
DB_PASS="$(sudo cat /etc/blissbakery-v5.dbpass)"
cp /tmp/.env.server .env
# DB credentials and signing key are generated on this host, never transported
if [ ! -f /etc/blissbakery-v5.jwt ]; then
  openssl rand -base64 32 | sudo tee /etc/blissbakery-v5.jwt >/dev/null
  sudo chmod 600 /etc/blissbakery-v5.jwt
fi
{
  echo "DATABASE_URL=\"mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}\""
  echo "JWT_SECRET=\"$(sudo cat /etc/blissbakery-v5.jwt)\""
  echo "PORT=${PORT}"
} >> .env
chmod 600 .env
echo "    $(grep -c '=' .env) variables set"

echo "==> npm ci"
npm ci --no-audit --no-fund --silent

echo "==> prisma"
npx prisma generate >/dev/null
npx prisma db push --skip-generate --accept-data-loss >/dev/null
echo "    schema synced"

echo "==> build"
npm run build 2>&1 | tail -5

# output:"standalone" means server.js is the entrypoint; it needs static assets beside it
echo "==> stage standalone assets"
cp -r .next/static "${APP_DIR}/.next/standalone/.next/static"
cp -r public "${APP_DIR}/.next/standalone/public"

echo "==> pm2"
pm2 delete "${PM2_NAME}" >/dev/null 2>&1 || true
PORT=${PORT} HOSTNAME=127.0.0.1 pm2 start "${APP_DIR}/.next/standalone/server.js" \
  --name "${PM2_NAME}" --cwd "${APP_DIR}/.next/standalone"
pm2 save >/dev/null
sudo env PATH="$PATH" pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || true

echo "==> waiting for app"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${PORT}/" || echo 000)
  [ "$code" = "200" ] && { echo "    app responding 200"; break; }
  sleep 2
done

echo
echo "DEPLOY COMPLETE"
