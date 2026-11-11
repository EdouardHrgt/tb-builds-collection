# Downloads the database backups of the VPS to this PC (a fresh snapshot is made first).
# Double-click backup-from-vps.bat. The server address is asked once and saved in tools\vps.txt (not committed).
$ErrorActionPreference = 'Stop'
$dest = 'D:\Vermintide 2\SigmarArsenal'
$cfg = Join-Path $PSScriptRoot 'vps.txt'
if (-not (Test-Path $cfg)) {
  $v = Read-Host 'Server address (user@ip, e.g. deploy@1.2.3.4)'
  Set-Content -Path $cfg -Value $v
}
$server = (Get-Content $cfg -Raw).Trim()
New-Item -ItemType Directory -Force $dest | Out-Null

Write-Host '1/2 Making a fresh backup on the server (password asked)...'
ssh $server 'cd ~/sigmar/server && /usr/bin/npm run db:backup'

Write-Host "2/2 Downloading the backups to $dest (password asked again)..."
scp "${server}:/home/deploy/sigmar/server/backups/app-*.db" $dest

Write-Host 'Done. Files on this PC:'
Get-ChildItem $dest -Filter 'app-*.db' | Sort-Object Name | Format-Table Name, Length, LastWriteTime
