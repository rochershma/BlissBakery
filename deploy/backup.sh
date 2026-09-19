#!/usr/bin/env bash
# Back up the database and user uploads to a timestamped archive.
#   bash backup.sh [outdir]
# Safe to run from cron. Keeps the last 14 archives.
set -euo pipefail

APP_DIR=${APP_DIR:-/opt/blissbakery-v5}
OUTDIR=${1:-/var/backups/blissbakery}
KEEP=14
STAMP=$(date +%Y%m%d-%H%M%S)

# DATABASE_URL lives in .env; never echo it.
DB_URL=$(grep -E '^DATABASE_URL=' "$APP_DIR/.env" | head -1 | cut -d= -f2- | tr -d '"')
DB_NAME=$(echo "$DB_URL" | sed -E 's#.*/([^?]+).*#\1#')
DB_USER=$(echo "$DB_URL" | sed -E 's#mysql://([^:]+):.*#\1#')
DB_PASS=$(echo "$DB_URL" | sed -E 's#mysql://[^:]+:([^@]+)@.*#\1#')

sudo mkdir -p "$OUTDIR"

echo "==> dumping ${DB_NAME}"
# --single-transaction keeps it consistent without locking the site.
sudo mysqldump --single-transaction --quick --routines --triggers \
  -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" 2>/dev/null \
  | gzip > "/tmp/db-${STAMP}.sql.gz"
sudo mv "/tmp/db-${STAMP}.sql.gz" "$OUTDIR/"

echo "==> archiving uploads"
if [ -d "$APP_DIR/public/uploads" ]; then
  sudo tar -czf "$OUTDIR/uploads-${STAMP}.tar.gz" -C "$APP_DIR/public" uploads
else
  echo "    (no uploads dir)"
fi

echo "==> pruning to last ${KEEP}"
sudo bash -c "ls -1t ${OUTDIR}/db-*.sql.gz      2>/dev/null | tail -n +$((KEEP+1)) | xargs -r rm -f"
sudo bash -c "ls -1t ${OUTDIR}/uploads-*.tar.gz 2>/dev/null | tail -n +$((KEEP+1)) | xargs -r rm -f"

echo
echo "==> done"
sudo ls -lh "$OUTDIR" | tail -5
echo
echo "Latest DB dump: ${OUTDIR}/db-${STAMP}.sql.gz"
