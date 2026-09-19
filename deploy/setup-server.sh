#!/usr/bin/env bash
# One-time server provisioning for Bliss Bakery v5 on a bare Ubuntu 24.04 host.
# Idempotent: safe to re-run.
set -euo pipefail

APP_DIR=/opt/blissbakery-v5
DB_NAME=blissbakery_v5
DB_USER=blissbakery

echo "==> apt update + base packages"
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -qq
sudo apt-get install -y -qq curl ca-certificates gnupg ufw openssl >/dev/null

echo "==> Node.js 20"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null
  sudo apt-get install -y -qq nodejs >/dev/null
fi
echo "    node $(node -v), npm $(npm -v)"

echo "==> MySQL 8"
if ! command -v mysql >/dev/null 2>&1; then
  sudo apt-get install -y -qq mysql-server >/dev/null
fi
sudo systemctl enable --now mysql >/dev/null 2>&1 || true
echo "    $(mysql --version)"

echo "==> Nginx"
if ! command -v nginx >/dev/null 2>&1; then
  sudo apt-get install -y -qq nginx >/dev/null
fi
sudo systemctl enable --now nginx >/dev/null 2>&1 || true

echo "==> PM2"
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2 --silent >/dev/null
fi

echo "==> database + app user"
# Password is generated here and never leaves the server except into .env
if [ ! -f /etc/blissbakery-v5.dbpass ]; then
  openssl rand -base64 24 | tr -d '/+=' | head -c 28 | sudo tee /etc/blissbakery-v5.dbpass >/dev/null
  sudo chmod 600 /etc/blissbakery-v5.dbpass
fi
DB_PASS="$(sudo cat /etc/blissbakery-v5.dbpass)"

sudo mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
sudo mysql -e "ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
sudo mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost'; FLUSH PRIVILEGES;"
echo "    database '${DB_NAME}' ready"

echo "==> app directory"
sudo mkdir -p "${APP_DIR}"
sudo chown -R "$USER":"$USER" "${APP_DIR}"

echo "==> firewall"
sudo ufw allow OpenSSH >/dev/null 2>&1 || true
sudo ufw allow 'Nginx Full' >/dev/null 2>&1 || true
sudo ufw --force enable >/dev/null 2>&1 || true

echo "==> nightly database backup (keeps 14 days)"
sudo mkdir -p /var/backups/blissbakery
sudo tee /usr/local/bin/bliss-backup.sh >/dev/null <<BACKUP
#!/usr/bin/env bash
set -eu
STAMP=\$(date +%Y%m%d-%H%M%S)
mysqldump --single-transaction --quick --default-character-set=utf8mb4 \\
  -u root ${DB_NAME} | gzip > /var/backups/blissbakery/${DB_NAME}-\${STAMP}.sql.gz
find /var/backups/blissbakery -name '*.sql.gz' -mtime +14 -delete
BACKUP
sudo chmod +x /usr/local/bin/bliss-backup.sh
echo "0 2 * * * root /usr/local/bin/bliss-backup.sh" | sudo tee /etc/cron.d/bliss-backup >/dev/null

echo
echo "SERVER READY"
