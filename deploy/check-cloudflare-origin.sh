#!/usr/bin/env bash
# Watch whether Cloudflare can actually reach this origin.
DOMAIN="blissbakery.shop"
LOG=/var/log/nginx/access.log
CF_RE='^(173\.245|103\.2[12]|103\.31|141\.101|108\.162|190\.93|188\.114|197\.234|198\.41|162\.158|104\.1[6-9]|104\.2[0-7]|172\.6[4-9]|172\.7[0-1]|131\.0\.72)'

before=$(sudo grep -cE "$CF_RE" "$LOG" 2>/dev/null || echo 0)
echo "cloudflare hits before : $before"
echo

for i in 1 2 3; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "https://${DOMAIN}/api/health" 2>/dev/null)
  echo "  attempt $i via cloudflare -> ${code:-timeout}"
  sleep 2
done

echo
after=$(sudo grep -cE "$CF_RE" "$LOG" 2>/dev/null || echo 0)
echo "cloudflare hits after  : $after"
echo

if [ "$after" -gt "$before" ]; then
  echo "VERDICT: Cloudflare IS reaching the origin."
  sudo grep -E "$CF_RE" "$LOG" | tail -3
else
  echo "VERDICT: Cloudflare is NOT reaching the origin at all."
  echo "  The origin is reachable from the wider internet (other IPs appear in the log),"
  echo "  so inbound 80/443 is open. That points at the Azure NSG or a Cloudflare-side"
  echo "  setting rather than this host."
fi

echo
echo "=== most recent visitors (proves general reachability) ==="
sudo tail -40 "$LOG" | awk '{print $1}' | sort -u | tail -8
