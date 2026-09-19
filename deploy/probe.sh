#!/usr/bin/env bash
# Probe the target server for an existing Bliss Bakery install and stack.
set -u
echo "=== HOST ==="
hostnamectl 2>/dev/null | sed -n '1,3p' || true
echo "os=$(lsb_release -ds 2>/dev/null)"
echo "cpu=$(nproc)"
free -m | awk '/Mem:/ {print "ram_mb=" $2}'
df -h / | awk 'NR==2 {print "disk_free=" $4}'

echo
echo "=== TOOLCHAIN ==="
for c in node npm git mysql nginx pm2 certbot; do
  if command -v "$c" >/dev/null 2>&1; then
    printf '%-8s %s\n' "$c" "$($c --version 2>&1 | head -1)"
  else
    printf '%-8s MISSING\n' "$c"
  fi
done

echo
echo "=== EXISTING APP ==="
ls -la /opt 2>/dev/null | grep -i bliss || echo "no /opt/bliss* dir"
pm2 list 2>/dev/null || echo "pm2 not running / not installed"

echo
echo "=== MYSQL DATABASES ==="
sudo mysql -N -e "SHOW DATABASES;" 2>/dev/null || echo "cannot query mysql (not installed or no socket auth)"

echo
echo "=== LISTENING PORTS ==="
sudo ss -tlnp 2>/dev/null | awk 'NR==1 || /:80 |:443 |:3000 |:3306 /' || true

echo
echo "=== NGINX SITES ==="
ls -la /etc/nginx/sites-enabled 2>/dev/null || echo "no nginx sites-enabled"
