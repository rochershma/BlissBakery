#!/usr/bin/env bash
# The dump came from Windows MySQL (lower_case_table_names=1) so tables restored
# lowercase. Linux MySQL is case-sensitive, and Prisma expects PascalCase.
set -euo pipefail
DB=blissbakery_v5

MODELS="Address Asset Banner Category CustomCakeOrder Occasion Order OrderItem \
OrderStatusLog OtpSession Product ProductAddOn ProductVariant PromoCode \
Recipient Store StoreAddOn Theme ThemeTag User"

echo "==> renaming tables to Prisma casing"
renamed=0
for M in $MODELS; do
  LOWER=$(echo "$M" | tr '[:upper:]' '[:lower:]')
  exists_lower=$(sudo mysql -N -B -e \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB}' AND BINARY table_name='${LOWER}';")
  exists_target=$(sudo mysql -N -B -e \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB}' AND BINARY table_name='${M}';")
  if [ "$exists_lower" = "1" ] && [ "$exists_target" = "0" ]; then
    sudo mysql -e "RENAME TABLE \`${DB}\`.\`${LOWER}\` TO \`${DB}\`.\`${M}\`;"
    renamed=$((renamed+1))
  fi
done
echo "    renamed ${renamed} tables"

echo "==> final table list"
sudo mysql -N -B -e "SELECT table_name FROM information_schema.tables WHERE table_schema='${DB}' ORDER BY table_name;"

echo "==> row counts"
for T in Product Order User Category Store; do
  C=$(sudo mysql -N -B -e "SELECT COUNT(*) FROM \`${DB}\`.\`${T}\`;" 2>/dev/null || echo "ERR")
  printf '    %-10s %s\n' "$T" "$C"
done
