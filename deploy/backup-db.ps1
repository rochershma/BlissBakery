# Dumps the local v5 database using credentials from .env.
# The password is passed via MYSQL_PWD so it never appears in the command line or output.
$ErrorActionPreference = "Stop"

$envLine = (Select-String -Path .env -Pattern '^DATABASE_URL=').Line
if (-not $envLine) { throw "DATABASE_URL not found in .env" }

# mysql://user:pass@host:port/dbname
$url = $envLine -replace '^DATABASE_URL=', '' -replace '^"', '' -replace '"$', ''
if ($url -notmatch '^mysql://([^:]+):([^@]*)@([^:/]+):(\d+)/(.+?)(\?.*)?$') { throw "Could not parse DATABASE_URL" }
$dbUser = $Matches[1]; $dbPass = $Matches[2]; $dbHost = $Matches[3]; $dbPort = $Matches[4]; $dbName = $Matches[5]

$dump = Get-ChildItem "C:\Program Files\MySQL" -Filter mysqldump.exe -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match 'Server 8' } | Select-Object -First 1 -ExpandProperty FullName
if (-not $dump) { throw "mysqldump.exe not found" }

New-Item -ItemType Directory -Force -Path backups | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$out = "backups/v5-$stamp.sql"

Write-Host "dumping '$dbName' from ${dbHost}:${dbPort} ..."
$env:MYSQL_PWD = $dbPass
# Write raw bytes: Out-File would add a UTF-8 BOM that breaks `mysql <` on Linux.
$sql = & $dump --host=$dbHost --port=$dbPort --user=$dbUser `
        --single-transaction --quick --routines --events `
        --default-character-set=utf8mb4 --set-gtid-purged=OFF `
        $dbName | Out-String
$env:MYSQL_PWD = $null
$sql = $sql -replace "`r`n", "`n"
[System.IO.File]::WriteAllText((Join-Path $PWD $out), $sql, (New-Object System.Text.UTF8Encoding($false)))

$size = (Get-Item $out).Length
Write-Host ("wrote {0} ({1:N1} MB)" -f $out, ($size / 1MB))
if ($size -lt 10KB) { throw "dump looks too small - check credentials" }
Write-Host "tables: $((Select-String -Path $out -Pattern '^CREATE TABLE').Count)"
