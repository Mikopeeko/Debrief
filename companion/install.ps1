# Installs Debrief in game for this Windows user, in one go (Debrief-Setup.exe runs this):
# puts the app in your user folder, clears the "downloaded from the internet" flag so Windows stops warning, then starts
# Debrief Companion.exe once with --install: it puts the Debrief addon into WoW (never over a newer copy, say one from CurseForge),
# adds a Debrief icon to your desktop and Start menu, starts with Windows from then on, says it's done and opens its window.
$ErrorActionPreference = 'Stop'
$src = Split-Path -Parent $MyInvocation.MyCommand.Path
$dst = Join-Path $env:LOCALAPPDATA 'Debrief Companion'
Add-Type -AssemblyName System.Windows.Forms
try {
  # 1. stop a copy that's already running (the app, or the older PowerShell one), so its files can be replaced
  Get-Process -Name 'Debrief Companion' -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path -like ($dst + '\*') } | Stop-Process -Force -ErrorAction SilentlyContinue
  Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'companion\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Milliseconds 600

  # 2. the app, in your user folder (no admin rights needed; your settings there are kept)
  New-Item -ItemType Directory -Force -Path $dst | Out-Null
  $zip = Join-Path $src 'app.zip'
  if (-not (Test-Path $zip)) { throw 'Some files are missing. Download Debrief-Setup.exe again.' }
  Expand-Archive -LiteralPath $zip -DestinationPath $dst -Force
  Get-ChildItem -LiteralPath $dst -Recurse -File | Unblock-File -ErrorAction SilentlyContinue
  $exe = Join-Path $dst 'Debrief Companion.exe'
  if (-not (Test-Path -LiteralPath $exe)) { throw 'Some files are missing. Download Debrief-Setup.exe again.' }

  # 3. the app does the rest (the installer never asks for admin rights, so this runs as you)
  Start-Process -FilePath $exe -ArgumentList '--install' -WorkingDirectory $dst
  if ($env:DBF_SILENT) { Write-Host ('started ' + $exe) }
}
catch {
  if ($env:DBF_SILENT) { Write-Host ('FAILED: ' + $_.Exception.Message) } else { [void][System.Windows.Forms.MessageBox]::Show("Debrief couldn't finish installing:`n`n" + $_.Exception.Message, 'Debrief', 'OK', 'Error') }
}
