# Builds the downloads into companion\dist:
#   Debrief-Setup.exe        one press: installs Debrief Companion (desktop icon, no black window) and the addon (Windows' own IExpress)
#   Debrief-addon-<v>.zip    the addon alone, the way CurseForge and every addon manager want it (a Debrief folder at the top)
#   app.zip + latest.json    what the app's self-updater downloads from debriefme.io/companion/ (once the site hosts them)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
$dist = Join-Path $here 'dist'
$work = Join-Path $env:TEMP ('debrief-build-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Force -Path $dist, $work | Out-Null
$appV = (Get-Content (Join-Path $here 'version.txt') -Raw).Trim()
$addV = ((Get-Content (Join-Path $here 'addon\Debrief\Debrief.toc')) -match '^## Version:' | Select-Object -First 1) -replace '^## Version:\s*', ''

# the app's files
$app = Join-Path $work 'app'; New-Item -ItemType Directory -Force -Path $app | Out-Null
foreach ($f in 'companion.ps1', 'companion.html', 'recap.js', 'Start Debrief.vbs', 'debrief.ico', 'version.txt') { Copy-Item -LiteralPath (Join-Path $here $f) -Destination $app }
Copy-Item -LiteralPath (Join-Path $root 'WoW-Log-Analyzer.html') -Destination (Join-Path $app 'Debrief.html')
Copy-Item -LiteralPath (Join-Path $here 'addon') -Destination (Join-Path $app 'addon') -Recurse
$appZip = Join-Path $dist 'app.zip'; if (Test-Path $appZip) { Remove-Item $appZip -Force }
Compress-Archive -Path (Join-Path $app '*') -DestinationPath $appZip
$sha = (Get-FileHash $appZip -Algorithm SHA256).Hash
@{ version = $appV; url = 'https://debriefme.io/companion/app.zip'; sha256 = $sha; addon = $addV } | ConvertTo-Json | ForEach-Object { [IO.File]::WriteAllText((Join-Path $dist 'latest.json'), $_, (New-Object Text.UTF8Encoding $false)) } # (no BOM: the updater reads it as JSON)

# the addon alone (CurseForge)
$addZip = Join-Path $dist ("Debrief-addon-$addV.zip"); if (Test-Path $addZip) { Remove-Item $addZip -Force }
Compress-Archive -Path (Join-Path $here 'addon\Debrief') -DestinationPath $addZip

# the one-press installer
$pay = Join-Path $work 'payload'; New-Item -ItemType Directory -Force -Path $pay | Out-Null
Copy-Item -LiteralPath $appZip -Destination $pay
Copy-Item -LiteralPath (Join-Path $here 'install.ps1') -Destination $pay
Set-Content -LiteralPath (Join-Path $pay 'setup.cmd') -Value @('@echo off', 'echo %date% %time% start %~dp0> "%TEMP%\debrief-setup.log"', 'powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0install.ps1" >> "%TEMP%\debrief-setup.log" 2>&1') -Encoding ASCII
$exe = Join-Path $dist 'Debrief-Setup.exe'; if (Test-Path $exe) { Remove-Item $exe -Force }
$sed = @"
[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=1
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=%InstallPrompt%
DisplayLicense=%DisplayLicense%
FinishMessage=%FinishMessage%
TargetName=%TargetName%
FriendlyName=%FriendlyName%
AppLaunched=%AppLaunched%
PostInstallCmd=%PostInstallCmd%
AdminQuietInstCmd=%AdminQuietInstCmd%
UserQuietInstCmd=%UserQuietInstCmd%
SourceFiles=SourceFiles
[Strings]
InstallPrompt=
DisplayLicense=
FinishMessage=
TargetName=$exe
FriendlyName=Debrief
AppLaunched=powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File install.ps1
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
FILE0="install.ps1"
FILE1="app.zip"
FILE2="setup.cmd"
[SourceFiles]
SourceFiles0=$pay\
[SourceFiles0]
%FILE0%=
%FILE1%=
%FILE2%=
"@
$sedPath = Join-Path $work 'setup.sed'; Set-Content -LiteralPath $sedPath -Value $sed -Encoding ASCII
$p = Start-Process -FilePath (Join-Path $env:WINDIR 'System32\iexpress.exe') -ArgumentList '/N', '/Q', $sedPath -Wait -PassThru
if (-not (Test-Path $exe)) { throw "IExpress didn't make the installer (exit $($p.ExitCode))." }
Remove-Item -Recurse -Force $work
# (the website serves these at debriefme.io/companion/: the download page, the installer, the addon and the updater's files)
$site = Join-Path $here '..site-assetscompanion'
if (Test-Path $site) {
  Copy-Item -LiteralPath $exe, (Join-Path $dist 'app.zip'), (Join-Path $dist 'latest.json') -Destination $site -Force
  Copy-Item -LiteralPath (Join-Path $dist ('Debrief-addon-' + $addV + '.zip')) -Destination (Join-Path $site 'Debrief-addon.zip') -Force
  (Get-Content -LiteralPath (Join-Path $site 'index.html') -Raw) -replace 'Version [0-9.]+.', ('Version ' + $addV + '.') | ForEach-Object { [IO.File]::WriteAllText((Join-Path $site 'index.html'), $_, (New-Object Text.UTF8Encoding $false)) }
}
"app $appV, addon $addV"
Get-ChildItem $dist | Select-Object Name, @{ n = 'KB'; e = { [int]($_.Length / 1KB) } } | Format-Table -AutoSize | Out-String
