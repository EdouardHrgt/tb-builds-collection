# Puts a backup from this PC back on the VPS (the live database is replaced).
# Double-click restore-to-vps.bat to use the latest backup, or run:  .\restore-to-vps.ps1 -File "D:\...\app-2026-11-11-0330.db"
# The current server database is kept next to it as app.db.before-restore.
param([string]$File)
$ErrorActionPreference = 'Stop'
$dest = 'D:\Vermintide 2\SigmarArsenal'
$cfg = Join-Path $PSScriptRoot 'vps.txt'
$server = if (Test-Path $cfg) { (Get-Content $cfg -Raw).Trim() } else { '' }
# It must look like user@host: anything else (a wrong line saved earlier) is replaced
while ($server -notmatch '^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$') {
  $server = (Read-Host 'Server address, ONLY user@ip (e.g. deploy@1.2.3.4)').Trim()
}
Set-Content -Path $cfg -Value $server -Encoding ASCII
if (-not $File) {
  $latest = Get-ChildItem $dest -Filter 'app-*.db' | Sort-Object Name | Select-Object -Last 1
  if (-not $latest) { throw "No backup found in $dest" }
  $File = $latest.FullName
}
Write-Host "Backup to restore: $File"
Write-Host 'The site will be stopped for a few seconds. Users created after this backup are lost.'
$ok = Read-Host 'Type YES to continue'
if ($ok -ne 'YES') { Write-Host 'Cancelled.'; exit }

scp $File "${server}:/tmp/restore.db"
# -t: sudo asks for the server password
ssh -t $server 'sudo systemctl stop sigmar && cd ~/sigmar/server/data && cp app.db app.db.before-restore && rm -f app.db-wal app.db-shm && mv /tmp/restore.db app.db && sudo systemctl start sigmar && systemctl is-active sigmar'
Write-Host 'Done. Open the site and check it.'
