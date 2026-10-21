# Installs Debrief in game for this Windows user, in one go (Debrief-Setup.exe runs this):
# puts the app in your user folder, clears the "downloaded from the internet" flag so Windows stops warning, puts the Debrief addon
# into WoW (never over a newer copy, say one from CurseForge), adds a Debrief icon to your desktop and Start menu, and starts it.
$ErrorActionPreference = 'Stop'
$src = Split-Path -Parent $MyInvocation.MyCommand.Path
$dst = Join-Path $env:LOCALAPPDATA 'Debrief Companion'
Add-Type -AssemblyName System.Windows.Forms
$lines = @()
try {
  # 1. stop a copy that's already running, so its files can be replaced
  Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'companion\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Milliseconds 400

  # 2. the app, in your user folder (no admin rights needed; your settings there are kept)
  New-Item -ItemType Directory -Force -Path $dst | Out-Null
  $zip = Join-Path $src 'app.zip'
  if (Test-Path $zip) { Expand-Archive -LiteralPath $zip -DestinationPath $dst -Force }
  elseif (Test-Path (Join-Path $src 'companion.ps1')) { if ($src.TrimEnd('\') -ne $dst.TrimEnd('\')) { Copy-Item -Path (Join-Path $src '*') -Destination $dst -Recurse -Force } }
  else { throw 'Some files are missing. Download Debrief-Setup.exe again.' }
  Get-ChildItem -LiteralPath $dst -Recurse -File | Unblock-File -ErrorAction SilentlyContinue

  # 3. the addon, into WoW
  $env:DBF_NO_UPDATE = '1'
  $addon = (& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $dst 'companion.ps1') -InstallOnly 2>&1 | Out-String).Trim()
  $lines += $addon

  # 4. a Debrief icon on the desktop and in the Start menu
  $ws = New-Object -ComObject WScript.Shell
  $target = Join-Path $env:WINDIR 'System32\wscript.exe'
  $vbs = Join-Path $dst 'Start Debrief.vbs'
  foreach ($dir in [Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs')) {
    $lnk = $ws.CreateShortcut((Join-Path $dir 'Debrief Companion.lnk'))
    $lnk.TargetPath = $target; $lnk.Arguments = '"' + $vbs + '"'; $lnk.WorkingDirectory = $dst
    $lnk.IconLocation = (Join-Path $dst 'debrief.ico') + ',0'; $lnk.Description = 'Debrief Companion: your pull recap in WoW'
    $lnk.Save()
  }

  # 5. start it (the installer never asks for admin rights, so this runs as you)
  Start-Process -FilePath $target -ArgumentList ('"' + $vbs + '"')
  $ok = $addon -match 'installed in'
  $msg = "Debrief is installed.`n`n" + $addon + "`n`nA Debrief icon is on your desktop. In WoW, type /reload if it was open.`nAfter each boss pull the Debrief box pops up: press Ctrl+V."
  if ($env:DBF_SILENT) { Write-Host $msg } else { [void][System.Windows.Forms.MessageBox]::Show($msg, 'Debrief', 'OK', $(if ($ok) { 'Information' } else { 'Warning' })) }
}
catch {
  if ($env:DBF_SILENT) { Write-Host ('FAILED: ' + $_.Exception.Message) } else { [void][System.Windows.Forms.MessageBox]::Show("Debrief couldn't finish installing:`n`n" + $_.Exception.Message, 'Debrief', 'OK', 'Error') }
}
