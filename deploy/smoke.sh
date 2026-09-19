#!/usr/bin/env bash
# Compares responses through Nginx (:80) with the app directly (:3005).
set -u
PATHS="/ /store/kuchaman-city/menu /cakes/birthday /cart /checkout /orders /admin"
printf '%-34s %-10s %s\n' "PATH" "VIA-NGINX" "DIRECT"
for p in $PATHS; do
  n=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost${p}" || echo 000)
  d=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3005${p}" || echo 000)
  printf '%-34s %-10s %s\n' "$p" "$n" "$d"
done
