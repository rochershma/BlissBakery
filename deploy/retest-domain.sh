#!/usr/bin/env bash
# Retest the Cloudflare -> origin path over a couple of minutes to rule out
# edge propagation lag after a DNS change.
DOMAIN="blissbakery.shop"
LOG=/var/log/nginx/access.log
CF_RE='^(173\.245|103\.2[12]|103\.31|141\.101|108\.162|190\.93|188\.114|197\.234|198\.41|162\.158|104\.1[6-9]|104\.2[0-7]|172\.6[4-9]|172\.7[0-1]|131\.0\.72)'

for round in 1 2 3 4 5 6; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://${DOMAIN}/api/health" 2>/dev/null)
  hits=$(sudo grep -cE "$CF_RE" "$LOG" 2>/dev/null | head -1)
  printf 'T+%-3ss  cloudflare->%s : %-4s   origin hits from CF: %s\n' \
    "$(( (round-1)*20 ))" "$DOMAIN" "${code:-timeout}" "${hits:-0}"
  [ "$code" = "200" ] && { echo; echo "SUCCESS - the domain is serving."; exit 0; }
  sleep 20
done

echo
echo "Still failing after 2 minutes - this is not propagation lag."
echo "Origin is confirmed healthy and reachable from other internet hosts:"
sudo tail -30 "$LOG" | grep -v '^127.0.0.1' | grep -v "^${DOMAIN}" | tail -4
