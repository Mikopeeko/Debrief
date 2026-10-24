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
# (zips with "/" in their paths: Windows' Compress-Archive writes "\", which CurseForge and Mac tools read as part of a file name)
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
function New-Zip($srcDir, $zipPath, $prefix) {
  if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
  $base = (Resolve-Path -LiteralPath $srcDir).Path.TrimEnd('\')
  $z = [IO.Compression.ZipFile]::Open($zipPath, 'Create')
  try { Get-ChildItem -LiteralPath $base -Recurse -File | ForEach-Object { [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($z, $_.FullName, $prefix + $_.FullName.Substring($base.Length + 1).Replace('\', '/'), 'Optimal') } }
  finally { $z.Dispose() }
}
# (code signing with Microsoft Artifact Signing, only on a PC set up for it: DBF_SIGN_DLIB (the path to Azure.CodeSigning.Dlib.dll) and
# DBF_SIGN_META (the path to metadata.json: endpoint, account and certificate profile, no secrets) as Windows environment variables; the
# sign-in comes from Azure's own login on this PC, never from a file here. Without them, or without signtool, the build stays unsigned)
function Sign-Files([string[]]$paths) {
  $dlib = $env:DBF_SIGN_DLIB; $meta = $env:DBF_SIGN_META
  if (-not $dlib -or -not $meta -or -not (Test-Path -LiteralPath $dlib) -or -not (Test-Path -LiteralPath $meta)) { return }
  $st = $env:DBF_SIGNTOOL
  if (-not $st) { $st = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe" -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName }
  if (-not $st) { Write-Warning 'Signing is set up but signtool.exe was not found: this build is unsigned.'; return }
  & $st sign /fd SHA256 /tr 'http://timestamp.acs.microsoft.com' /td SHA256 /dlib $dlib /dmdf $meta @paths | Out-Host
  if ($LASTEXITCODE -ne 0) { throw 'Signing failed.' }
}
$appV = (Get-Content (Join-Path $here 'version.txt') -Raw).Trim()
$addV = ((Get-Content (Join-Path $here 'addon\Debrief\Debrief.toc')) -match '^## Version:' | Select-Object -First 1) -replace '^## Version:\s*', ''

# the app itself: Debrief Companion.exe from app\ (needs the .NET SDK on the PC that builds it; raiders need nothing)
$app = Join-Path $work 'app'; New-Item -ItemType Directory -Force -Path $app | Out-Null
$dotnet = Join-Path $env:ProgramFiles 'dotnet\dotnet.exe'
$exeOut = Join-Path $work 'exe'
& $dotnet build (Join-Path $here 'app\DebriefCompanion.csproj') -c Release -o $exeOut --nologo -v q | Out-Host
if ($LASTEXITCODE -ne 0 -or -not (Test-Path (Join-Path $exeOut 'Debrief Companion.exe'))) { throw "The app didn't build." }
Sign-Files @((Join-Path $exeOut 'Debrief Companion.exe')) # (before it is zipped, so the updater's app.zip carries the signed app)
foreach ($f in 'Debrief Companion.exe', 'Debrief Companion.exe.config', 'Microsoft.Web.WebView2.Core.dll', 'Microsoft.Web.WebView2.WinForms.dll') { Copy-Item -LiteralPath (Join-Path $exeOut $f) -Destination $app }
Copy-Item -LiteralPath (Join-Path $exeOut 'runtimes') -Destination (Join-Path $app 'runtimes') -Recurse
# (companion.ps1 and Start Debrief.vbs now only start the app: they move copies from 0.5 and older over)
foreach ($f in 'companion.ps1', 'companion.html', 'popup.html', 'recap.js', 'Start Debrief.vbs', 'debrief.ico', 'version.txt') { Copy-Item -LiteralPath (Join-Path $here $f) -Destination $app }
Sign-Files @((Join-Path $app 'companion.ps1'), (Join-Path $app 'Start Debrief.vbs')) # (the two small starters, signed copies only)
# (the engine: DBF_ENGINE names a clean, committed build; otherwise the one in this folder, which may hold unfinished work)
$engine = if ($env:DBF_ENGINE) { $env:DBF_ENGINE } else { Join-Path $root 'WoW-Log-Analyzer.html' }
Copy-Item -LiteralPath $engine -Destination (Join-Path $app 'Debrief.html')
Copy-Item -LiteralPath (Join-Path $here 'addon') -Destination (Join-Path $app 'addon') -Recurse
$appZip = Join-Path $dist 'app.zip'; if (Test-Path $appZip) { Remove-Item $appZip -Force }
New-Zip $app $appZip ''
$sha = (Get-FileHash $appZip -Algorithm SHA256).Hash
@{ version = $appV; url = 'https://debriefme.io/companion/app.zip'; sha256 = $sha; addon = $addV } | ConvertTo-Json | ForEach-Object { [IO.File]::WriteAllText((Join-Path $dist 'latest.json'), $_, (New-Object Text.UTF8Encoding $false)) } # (no BOM: the updater reads it as JSON)

# the addon alone (CurseForge)
$addZip = Join-Path $dist ("Debrief-addon-$addV.zip"); if (Test-Path $addZip) { Remove-Item $addZip -Force }
New-Zip (Join-Path $here 'addon\Debrief') $addZip 'Debrief/'

# the one-press installer
$pay = Join-Path $work 'payload'; New-Item -ItemType Directory -Force -Path $pay | Out-Null
Copy-Item -LiteralPath $appZip -Destination $pay
Copy-Item -LiteralPath (Join-Path $here 'install.ps1') -Destination $pay
Sign-Files @((Join-Path $pay 'install.ps1'))
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
Sign-Files @($exe)
Remove-Item -Recurse -Force $work
# (the website serves these at debriefme.io/companion/: the download page, the installer, the addon and the updater's files)
$site = Join-Path $root 'site-assets\companion'
if (Test-Path $site) {
  Copy-Item -LiteralPath $exe, (Join-Path $dist 'app.zip'), (Join-Path $dist 'latest.json') -Destination $site -Force
  Copy-Item -LiteralPath (Join-Path $dist ('Debrief-addon-' + $addV + '.zip')) -Destination (Join-Path $site 'Debrief-addon.zip') -Force
  (Get-Content -LiteralPath (Join-Path $site 'index.html') -Raw) -replace 'Version [0-9.]+.', ('Version ' + $addV + '.') | ForEach-Object { [IO.File]::WriteAllText((Join-Path $site 'index.html'), $_, (New-Object Text.UTF8Encoding $false)) }
}
"app $appV, addon $addV"
Get-ChildItem $dist | Select-Object Name, @{ n = 'KB'; e = { [int]($_.Length / 1KB) } } | Format-Table -AutoSize | Out-String
