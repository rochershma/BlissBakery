#!/usr/bin/env bash
# Independent multi-node TCP reachability check via check-host.net (no key needed).
IP=${1:-172.187.217.79}

check() {
  local port=$1
  local req
  req=$(curl -s -H 'Accept: application/json' --max-time 20 \
        "https://check-host.net/check-tcp?host=${IP}:${port}&max_nodes=4")
  local id
  id=$(echo "$req" | grep -oE '"request_id":"[0-9]+"' | cut -d'"' -f4)
  if [ -z "$id" ]; then echo "  port ${port}: could not queue check"; return; fi
  sleep 12
  local res
  res=$(curl -s -H 'Accept: application/json' --max-time 20 \
        "https://check-host.net/check-result/${id}")
  local ok=0 fail=0
  # each node returns either {"time":..,"address":..} on success or an error string
  while read -r line; do
    case "$line" in
      *'"time"'*) ok=$((ok+1)) ;;
      *error*|*null*) fail=$((fail+1)) ;;
    esac
  done < <(echo "$res" | tr '}' '\n')
  echo "  port ${port}:  reachable from ${ok} node(s), failed from ${fail}"
}

echo "=== external TCP reachability of ${IP} ==="
check 80
check 443
