#!/usr/bin/env bash
# Restore a database dump produced by backup.sh.
#   bash restore.sh /var/backups/blissbakery/db-20260919-201500.sql.gz
#
# MySQL on Linux is case-sensitive about table names while MySQL on Windows is
# not, so a dump taken on Windows arrives lowercase. Prisma expects PascalCase,
# so we repair the casing after import.
set -euo pipefail

DUMP=${1:?usage: restore.sh <dump.sql.gz|dump.sql>}
APP_DIR=${APP_DIR:-/opt/blissbakery-v5}

DB_URL=$(grep -E '^DATABASE_URL=' "$APP_DIR/.env" | head -1 | cut -d= -f2- | tr -d '"')
DB_NAME=$(echo "$DB_URL" | sed -E 's#.*/([^?]+).*#\1#')

echo "==> restoring into ${DB_NAME} from $(basename "$DUMP")"
read -r -p "    this REPLACES current data. continue? [y/N] " ok
[ "$ok" = "y" ] || { echo "aborted"; exit 1; }

TMP=/tmp/restore-$$.sql
if [[ "$DUMP" == *.gz ]]; then gunzip -c "$DUMP" > "$TMP"; else cp "$DUMP" "$TMP"; fi

# Strip a UTF-8 BOM and CRLF line endings if the dump came from Windows.
sed -i '1s/^\xEF\xBB\xBF//' "$TMP"
sed -i 's/\r$//' "$TMP"

sudo mysql -e "DROP DATABASE IF EXISTS \`${DB_NAME}\`; CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql "${DB_NAME}" < "$TMP"
rm -f "$TMP"

echo "==> repairing table name casing for Prisma"
bash "$(dirname "$0")/fix-table-case.sh" || true

echo
echo "==> row counts"
sudo mysql -N -e "SELECT 'products', COUNT(*) FROM \`${DB_NAME}\`.Product
  UNION ALL SELECT 'orders', COUNT(*) FROM \`${DB_NAME}\`.\`Order\`
  UNION ALL SELECT 'users',  COUNT(*) FROM \`${DB_NAME}\`.User;" 2>/dev/null \
  || echo "    (verify manually)"

echo
echo "==> restart the app:  pm2 restart blissbakery-v5"
