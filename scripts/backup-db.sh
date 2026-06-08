#!/bin/bash
DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR=/opt/db-backups
mkdir -p $BACKUP_DIR

# Dump both databases
mysqldump -u root blissbakery_v2 > $BACKUP_DIR/v2_$DATE.sql
mysqldump -u root blissbakery > $BACKUP_DIR/v1_$DATE.sql

# Keep only last 48 backups (4 days at every 2 hours)
ls -t $BACKUP_DIR/v2_*.sql 2>/dev/null | tail -n +49 | xargs rm -f 2>/dev/null
ls -t $BACKUP_DIR/v1_*.sql 2>/dev/null | tail -n +49 | xargs rm -f 2>/dev/null

echo "$(date): Backup done - v2: $(wc -c < $BACKUP_DIR/v2_$DATE.sql) bytes, v1: $(wc -c < $BACKUP_DIR/v1_$DATE.sql) bytes"
