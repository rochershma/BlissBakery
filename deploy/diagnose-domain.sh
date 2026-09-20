#!/usr/bin/env bash
# Diagnose why the public domain isn't serving, from a clean network path.
DOMAIN="blissbakery.shop"
MYIP=$(curl -s -4 --max-time 10 ifconfig.me || echo "?")

echo "=== this server ==="
echo "  public IP : ${MYIP}"

echo
echo "=== what the domain resolves to ==="
for h in "${DOMAIN}" "www.${DOMAIN}"; do
  ips=$(dig +short A "$h" | tr '\n' ' ')
  echo "  ${h} -> ${ips:-<none>}"
done

echo
echo "=== is Cloudflare in front? ==="
dig +short NS "${DOMAIN}" | sed 's/^/  NS /'

echo
echo "=== what Cloudflare returns ==="
for u in "http://${DOMAIN}/api/health" "https://${DOMAIN}/api/health"; do
  out=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$u" 2>&1 || echo "000")
  echo "  ${u} -> ${out}"
done

echo
echo "=== Cloudflare error body (if any) ==="
curl -s --max-time 20 "https://${DOMAIN}/" 2>/dev/null | grep -oE 'Error [0-9]{3}|error code: [0-9]+' | head -3 || echo "  (none)"

echo
echo "=== does the ORIGIN answer directly? ==="
curl -s  -o /dev/null -w '  origin :80  (Host hdr) -> %{http_code}\n' --max-time 15 -H "Host: ${DOMAIN}" "http://${MYIP}/"
curl -sk -o /dev/null -w '  origin :443 (Host hdr) -> %{http_code}\n' --max-time 15 -H "Host: ${DOMAIN}" "https://${MYIP}/"

echo
echo "=== verdict ==="
CFIP=$(dig +short A "${DOMAIN}" | head -1)
if [ -z "$CFIP" ]; then
  echo "  NO DNS RECORD for ${DOMAIN}"
elif curl -s --max-time 10 "https://api.cloudflare.com" >/dev/null 2>&1 && [[ "$CFIP" =~ ^(104\.2[0-9]|172\.6[4-9]|172\.7[0-1]) ]]; then
  echo "  Domain is PROXIED by Cloudflare (${CFIP})."
  echo "  If you see 522 above, Cloudflare's origin is NOT ${MYIP}."
  echo "  Fix: Cloudflare -> DNS -> set A @ and A www to ${MYIP} (proxied)."
else
  echo "  Domain resolves to ${CFIP}"
  [ "$CFIP" = "$MYIP" ] && echo "  and that IS this server." || echo "  which is NOT this server (${MYIP})."
fi
