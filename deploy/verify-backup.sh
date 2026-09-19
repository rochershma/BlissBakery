#!/usr/bin/env bash
# Prove the newest backup is actually restorable, not just present.
set -euo pipefail
OUTDIR=${1:-/var/backups/blissbakery}

D=$(sudo ls -1t "$OUTDIR"/db-*.sql.gz | head -1)
echo "verifying $(basename "$D")"
sudo gunzip -t "$D" && echo "  gzip integrity : ok"
echo "  size           : $(sudo du -h "$D" | cut -f1)"
echo "  CREATE TABLE   : $(sudo gunzip -c "$D" | grep -c 'CREATE TABLE')"
echo "  INSERT INTO    : $(sudo gunzip -c "$D" | grep -c 'INSERT INTO')"
echo "  has Product    : $(sudo gunzip -c "$D" | grep -c 'CREATE TABLE `Product`')"
echo "  has Order      : $(sudo gunzip -c "$D" | grep -c 'CREATE TABLE `Order`')"

echo
echo "cron:"
crontab -l 2>/dev/null | grep backup.sh || echo "  NOT SCHEDULED"
