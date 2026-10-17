# Builds the app, from anywhere: ../WoW-Log-Analyzer.html (the app) and ../online/worker.js (the hosted site: the app
# baked into the Cloudflare Worker, with the Warcraft Logs queries it's allowed to run, taken from wcl.js).
# Windows PowerShell only, nothing to install. (build.py does the same where Python and Node are installed.)
$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot; $root = Split-Path $src
$read = { param($f) [IO.File]::ReadAllText((Join-Path $src $f)) }
$utf8 = New-Object Text.UTF8Encoding $false
$wcl = & $read 'wcl.js'
# (a syntax error would break the page for everyone with it open: check each script first, when Node is on this PC, and
# stop without writing anything)
$node = 'C:\Program Files\nodejs\node.exe'
if (Test-Path $node) { foreach ($f in 'engine.js', 'wcl.js', 'ui.js', 'worker_template.js') {
  $p = Join-Path $src $f; if ($f -eq 'worker_template.js') { $tmp = Join-Path $env:TEMP 'debrief-worker-check.mjs'; [IO.File]::WriteAllText($tmp, ([IO.File]::ReadAllText($p) -replace '__[A-Z_]+__', '""'), $utf8); $p = $tmp }
  & $node --check $p; if ($LASTEXITCODE) { throw "$f has a syntax error: nothing was built" } } }
$html =(& $read 'shell.html').Replace('/*ENGINE*/', (& $read 'engine.js')).Replace('/*WCL*/', $wcl).Replace('/*UI*/', (& $read 'ui.js')).Replace("`r`n", "`n")
[IO.File]::WriteAllText((Join-Path $root 'WoW-Log-Analyzer.html'), $html, $utf8)

# the Worker: every query the site may run (const NAME_Q = `...`; in wcl.js), then the hosted page itself
Add-Type -AssemblyName System.Web
$js = { param($s) [System.Web.HttpUtility]::JavaScriptStringEncode($s, $true) }
$q = @{}
foreach ($m in [regex]::Matches($wcl, 'const (\w+_Q) = `([^`]*)`;')) { $q[$m.Groups[1].Value] = $m.Groups[2].Value }
$w = & $read 'worker_template.js'
foreach ($n in 'REPORT_Q', 'EVENTS_Q', 'RANK_Q', 'TEAM_INFO_Q', 'TEAM_REPORTS_Q', 'NIGHT_Q', 'DEATHS_Q', 'CHAR_INFO_Q', 'CHAR_REPORTS_Q', 'CHAR_RANK_Q', 'TEAM_RANK_Q', 'CHAR_LOOK_Q') {
  if (-not $q.ContainsKey($n)) { throw "wcl.js has no $n" }
  $w = $w.Replace("__${n}__", (& $js $q[$n]))
}
$hosted = ([regex]'<head>').Replace($html, "<head>`n<script>window.WLA_HOSTED = true;</script>", 1)
$w = $w.Replace('__HTML__', (& $js $hosted)).Replace("`r`n", "`n")
if ($w -match '__[A-Z_]+_Q__|__HTML__') { throw 'worker.js still has a placeholder' }
New-Item -ItemType Directory -Force (Join-Path $root 'online') | Out-Null
[IO.File]::WriteAllText((Join-Path $root 'online\worker.js'), $w, $utf8)
"app: {0:N0} chars; worker: {1:N0} chars" -f $html.Length, $w.Length
