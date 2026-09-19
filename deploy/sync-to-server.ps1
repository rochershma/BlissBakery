# Copies the locally-changed files to the server when the GitHub push path is
# unavailable, then builds and restarts there.
$ErrorActionPreference = "Stop"
$KEY = "C:\Users\shesharma\Downloads\sheshlm_key.pem"
$SRV = "azureuser@172.187.217.79"
$APP = "/opt/blissbakery-v5"

$files = @(
  @{ local = "src/app/orders/page.tsx";        remote = "src/app/orders/page.tsx" },
  @{ local = "src/app/api/orders/route.ts";    remote = "src/app/api/orders/route.ts" },
  @{ local = "src/app/order/[id]/page.tsx";    remote = "src/app/order/[id]/page.tsx" },
  @{ local = "src/app/layout.tsx";             remote = "src/app/layout.tsx" },
  @{ local = "src/app/globals.css";            remote = "src/app/globals.css" },
  @{ local = "src/lib/auth.ts";                remote = "src/lib/auth.ts" },
  @{ local = "src/app/icon.png";               remote = "src/app/icon.png" },
  @{ local = "src/app/apple-icon.png";         remote = "src/app/apple-icon.png" },
  @{ local = "public/favicon.ico";             remote = "public/favicon.ico" }
)

$i = 0
foreach ($f in $files) {
  $i++
  $tmp = "/tmp/sync-$i.bin"
  & scp -o StrictHostKeyChecking=no -i $KEY $f.local "${SRV}:$tmp" | Out-Null
  & ssh -o StrictHostKeyChecking=no -i $KEY $SRV "sudo mkdir -p `$(dirname $APP/$($f.remote)) && sudo mv $tmp '$APP/$($f.remote)'" | Out-Null
  Write-Host ("  sent {0}" -f $f.remote)
}

# deploy scripts travel as a set
& scp -o StrictHostKeyChecking=no -i $KEY (Get-ChildItem deploy -File | ForEach-Object { $_.FullName }) "${SRV}:/tmp/" | Out-Null
& ssh -o StrictHostKeyChecking=no -i $KEY $SRV "sudo mkdir -p $APP/deploy && sudo cp /tmp/*.sh /tmp/README.md $APP/deploy/ 2>/dev/null; sudo sed -i 's/\r`$//' $APP/deploy/*.sh; echo '  sent deploy/'"

Write-Host "`nbuilding on server..."
& ssh -o StrictHostKeyChecking=no -i $KEY $SRV "sed -i 's/\r`$//' /tmp/build-local.sh; bash /tmp/build-local.sh"
