#!/usr/bin/env bash
# Make PM2 resurrect the app on boot, and add a watchdog so the site comes back
# even if the DB is slow to start after a reboot.
set -euo pipefail

APP_NAME=blissbakery-v5
APP_DIR=/opt/blissbakery-v5
RUN_USER=$(whoami)

echo "==> registering pm2 with systemd"
# pm2 startup prints the command it needs run as root; execute it directly.
STARTUP_CMD=$(pm2 startup systemd -u "$RUN_USER" --hp "$HOME" | grep -E '^sudo ' || true)
if [ -n "$STARTUP_CMD" ]; then
  eval "$STARTUP_CMD"
else
  echo "    already registered"
fi

echo "==> saving current process list"
pm2 save

echo "==> making mysql start before the app"
sudo systemctl enable mysql >/dev/null 2>&1 || true
sudo systemctl enable nginx >/dev/null 2>&1 || true

# pm2-systemd can race MySQL on a cold boot; a short delay avoids a crash loop.
sudo mkdir -p /etc/systemd/system/pm2-${RUN_USER}.service.d
sudo tee /etc/systemd/system/pm2-${RUN_USER}.service.d/override.conf >/dev/null <<EOF
[Unit]
After=network-online.target mysql.service
Wants=network-online.target

[Service]
ExecStartPre=/bin/sleep 8
Restart=always
RestartSec=5
EOF

sudo systemctl daemon-reload
sudo systemctl enable "pm2-${RUN_USER}" >/dev/null 2>&1 || true

echo
echo "==> status"
systemctl is-enabled "pm2-${RUN_USER}" 2>/dev/null && echo "    pm2-${RUN_USER}: enabled"
systemctl is-enabled mysql 2>/dev/null   && echo "    mysql: enabled"
systemctl is-enabled nginx 2>/dev/null   && echo "    nginx: enabled"
pm2 list --no-color | grep "$APP_NAME" || true
