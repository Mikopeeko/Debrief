# Debrief Companion is a real Windows app now: Debrief Companion.exe, next to this file (its source is in app\).
# This little script only moves older copies over. Version 0.5 and older update themselves by unpacking the new files here and
# starting companion.ps1 again; this starts the new app instead (with the same quiet choice), and the app points the Debrief
# icons on your desktop, in the Start menu and in your Startup folder at itself.
param([switch]$NoWindow, [switch]$InstallOnly)
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$exe = Join-Path $here 'Debrief Companion.exe'
if (-not (Test-Path -LiteralPath $exe)) { Write-Host 'Debrief Companion.exe is missing. Download Debrief-Setup.exe again from debriefme.io/companion.'; exit 1 }
Get-ChildItem -LiteralPath $here -Recurse -File -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue
$a = @()
if ($NoWindow) { $a += '--quiet' }
if ($InstallOnly) { $a += '--install-only' }
if ($a.Count) { $p = Start-Process -FilePath $exe -ArgumentList $a -WorkingDirectory $here -PassThru } else { $p = Start-Process -FilePath $exe -WorkingDirectory $here -PassThru }
if ($InstallOnly) { $p.WaitForExit(60000) | Out-Null }
