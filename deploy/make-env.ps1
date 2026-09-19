# Builds deploy/.env.server from the local .env, overriding host-specific values.
# Secrets are copied file-to-file and never printed.
param(
  [Parameter(Mandatory = $true)][string]$AppUrl
)
$ErrorActionPreference = "Stop"

$src = Get-Content .env
$keep = @("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET",
          "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
          "OTP_EXPIRY_MINUTES")

$out = New-Object System.Collections.Generic.List[string]
$out.Add("NODE_ENV=production")
$out.Add("NEXT_PUBLIC_APP_URL=`"$AppUrl`"")

$found = @()
foreach ($line in $src) {
  foreach ($k in $keep) {
    if ($line -match "^$k=") { $out.Add($line); $found += $k }
  }
}

New-Item -ItemType Directory -Force -Path deploy | Out-Null
$out | Set-Content deploy/.env.server -Encoding ascii

Write-Host "wrote deploy/.env.server"
Write-Host "  carried over: $($found -join ', ')"
Write-Host "  APP_URL     : $AppUrl"
Write-Host "  DATABASE_URL and JWT_SECRET are generated on the server"
