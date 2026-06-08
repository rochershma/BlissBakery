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

# Push to GitHub (keep only latest backup in git to avoid bloat)
REPO_DIR=/opt/blissbakery-v2
GIT_BACKUP_DIR=$REPO_DIR/backups
mkdir -p $GIT_BACKUP_DIR

# Ensure .gitignore is from git (allows backups/)
cd $REPO_DIR
git checkout -- .gitignore 2>/dev/null

# Copy latest backups (overwrite previous)
cp $BACKUP_DIR/v2_$DATE.sql $GIT_BACKUP_DIR/latest_v2.sql
cp $BACKUP_DIR/v1_$DATE.sql $GIT_BACKUP_DIR/latest_v1.sql

git add backups/latest_v2.sql backups/latest_v1.sql 2>/dev/null
git diff --cached --quiet || git commit -m "backup: DB dump $DATE" && git push origin master 2>/dev/null

echo "$(date): Pushed to GitHub"
