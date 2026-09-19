#!/usr/bin/env bash
# Move Bliss Bakery from this server to a new one, end to end.
# Run this ON THE CURRENT (source) SERVER.
#
#   bash migrate-to-new-server.sh <new-ip> <ssh-user> <path-to-key-on-this-box>
#
# It backs up here, provisions there, restores, deploys, and verifies.
# The old server is left running so you can switch DNS when you're ready.
set -euo pipefail

NEW_IP=${1:?usage: migrate-to-new-server.sh <new-ip> <ssh-user> <ssh-key>}
NEW_USER=${2:-azureuser}
SSH_KEY=${3:?need path to an ssh key that can reach the new server}

APP_DIR=${APP_DIR:-/opt/blissbakery-v5}
REPO=${REPO:-https://github.com/rochershma/BlissBakery.git}
BRANCH=${BRANCH:-v5}
SSH="ssh -o StrictHostKeyChecking=no -i ${SSH_KEY}"
SCP="scp -o StrictHostKeyChecking=no -i ${SSH_KEY}"
STAMP=$(date +%Y%m%d-%H%M%S)

echo "=============================================="
echo " MIGRATE  ->  ${NEW_USER}@${NEW_IP}"
echo "=============================================="

echo
echo "[1/6] backing up this server"
bash "$(dirname "$0")/backup.sh" /tmp/migrate-${STAMP}
DUMP=$(ls -1t /tmp/migrate-${STAMP}/db-*.sql.gz | head -1)
echo "      dump: $(basename "$DUMP")"

echo
echo "[2/6] copying bootstrap scripts to the new server"
$SCP "$(dirname "$0")"/*.sh "${NEW_USER}@${NEW_IP}:/tmp/"
$SSH "${NEW_USER}@${NEW_IP}" "sed -i 's/\r$//' /tmp/*.sh"

echo
echo "[3/6] provisioning the new server (node, mysql, nginx, pm2)"
$SSH "${NEW_USER}@${NEW_IP}" "bash /tmp/setup-server.sh"

echo
echo "[4/6] shipping code, env and data"
$SSH "${NEW_USER}@${NEW_IP}" "sudo mkdir -p ${APP_DIR} && sudo chown -R ${NEW_USER}:${NEW_USER} ${APP_DIR} \
  && git clone --branch ${BRANCH} --single-branch ${REPO} ${APP_DIR} 2>/dev/null || (cd ${APP_DIR} && git fetch origin ${BRANCH} && git reset --hard origin/${BRANCH})"
# .env carries the secrets; copy it directly rather than regenerating.
$SCP "${APP_DIR}/.env" "${NEW_USER}@${NEW_IP}:/tmp/.env.migrated"
$SSH "${NEW_USER}@${NEW_IP}" "sudo mv /tmp/.env.migrated ${APP_DIR}/.env && sudo chmod 600 ${APP_DIR}/.env"
$SCP "$DUMP" "${NEW_USER}@${NEW_IP}:/tmp/restore.sql.gz"
# uploads are only present if the site stores local images
UP=$(ls -1t /tmp/migrate-${STAMP}/uploads-*.tar.gz 2>/dev/null | head -1 || true)
[ -n "$UP" ] && $SCP "$UP" "${NEW_USER}@${NEW_IP}:/tmp/uploads.tar.gz" || true

echo
echo "[5/6] restoring data and deploying"
$SSH "${NEW_USER}@${NEW_IP}" "yes y | bash /tmp/restore.sh /tmp/restore.sql.gz"
$SSH "${NEW_USER}@${NEW_IP}" "[ -f /tmp/uploads.tar.gz ] && sudo tar -xzf /tmp/uploads.tar.gz -C ${APP_DIR}/public || true"
$SSH "${NEW_USER}@${NEW_IP}" "bash /tmp/deploy.sh"
$SSH "${NEW_USER}@${NEW_IP}" "bash /tmp/tls-enable.sh"
$SSH "${NEW_USER}@${NEW_IP}" "bash /tmp/enable-autostart.sh"

echo
echo "[6/6] verifying the new server"
$SSH "${NEW_USER}@${NEW_IP}" "bash /tmp/smoke.sh"

cat <<EOF

==============================================
 MIGRATION COMPLETE
==============================================
New server:  ${NEW_IP}

Remaining steps (manual, so you control the cutover):
  1. Cloudflare -> DNS: point A @ and A www to ${NEW_IP} (proxied)
  2. On the new server:  bash /tmp/tls-letsencrypt.sh
  3. Cloudflare -> SSL/TLS: Full (Strict)
  4. Watch for an hour, then decommission the old server.

The old server is still running and untouched.
EOF
