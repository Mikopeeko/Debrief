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
if (Test-Path $node) { foreach ($f in 'engine.js', 'wcl.js', 'ui.js', 'guides.js', 'mptab.js', 'worker_template.js') {
  $p = Join-Path $src $f; if ($f -eq 'worker_template.js') { $tmp = Join-Path $env:TEMP 'debrief-worker-check.mjs'; [IO.File]::WriteAllText($tmp, ([IO.File]::ReadAllText($p) -replace '__[A-Z_]+__', '""'), $utf8); $p = $tmp }
  & $node --check $p; if ($LASTEXITCODE) { throw "$f has a syntax error: nothing was built" } } }
# (the Mythic+ tab (Nov 1): the PC app's own key reader, companion/mplus.js, in its own script, and the tab, src/mptab.js, inside ui.js)
$mplus = [IO.File]::ReadAllText((Join-Path $root 'companion\mplus.js'))
# (and the app's card helpers, companion/recap.js (Nov 2): the tab's Rotation says each check the app's way)
$recap = [IO.File]::ReadAllText((Join-Path $root 'companion\recap.js'))
$html =(& $read 'shell.html').Replace('/*ENGINE*/', (& $read 'engine.js')).Replace('/*MPLUS*/', $mplus).Replace('/*RECAP*/', $recap).Replace('/*WCL*/', $wcl).Replace('/*UI*/', (& $read 'ui.js').Replace('/*GUIDES*/', (& $read 'guides.js')).Replace('/*MPTAB*/', (& $read 'mptab.js'))).Replace("`r`n", "`n")
[IO.File]::WriteAllText((Join-Path $root 'WoW-Log-Analyzer.html'), $html, $utf8)

# the Worker: every query the site may run (const NAME_Q = `...`; in wcl.js), then the hosted page itself
Add-Type -AssemblyName System.Web
$js = { param($s) [System.Web.HttpUtility]::JavaScriptStringEncode($s, $true) }
$q = @{}
foreach ($m in [regex]::Matches($wcl, 'const (\w+_Q) = `([^`]*)`;')) { $q[$m.Groups[1].Value] = $m.Groups[2].Value }
$w = & $read 'worker_template.js'
foreach ($n in 'REPORT_Q', 'EVENTS_Q', 'RANK_Q', 'TEAM_INFO_Q', 'TEAM_REPORTS_Q', 'NIGHT_Q', 'DEATHS_Q', 'CHAR_INFO_Q', 'CHAR_REPORTS_Q', 'TEAM_LATEST_Q', 'CHAR_LATEST_Q', 'CHAR_RANK_Q', 'TEAM_RANK_Q', 'CHAR_LOOK_Q', 'TOPRANK_Q', 'TOPAB_Q') {
  if (-not $q.ContainsKey($n)) { throw "wcl.js has no $n" }
  $w = $w.Replace("__${n}__", (& $js $q[$n]))
}
# (the top players' spell breakdown: the Worker runs wcl.js's own function, copied from between its markers)
$ts = [regex]::Match($wcl, '// <topspec>[\s\S]*?// </topspec>')
if (-not $ts.Success) { throw 'wcl.js has no <topspec> block' }
$w = $w.Replace('/*TOPSPEC*/', $ts.Value)
$hosted = ([regex]'<head>').Replace($html, "<head>`n<script>window.WLA_HOSTED = true;</script>", 1)
# (Nov 5, faster loading: the website's copy without the notes in the code, ~0.4 MB less to download (src/strip-comments.js says what stays);
# only when Node is on this PC, else the page goes as it is)
if (Test-Path $node) { $tin = Join-Path $env:TEMP 'debrief-site-in.html'; $tout = Join-Path $env:TEMP 'debrief-site-out.html'; [IO.File]::WriteAllText($tin, $hosted, $utf8)
  & $node (Join-Path $src 'strip-comments.js') $tin $tout; if ($LASTEXITCODE) { throw 'strip-comments.js failed: nothing was built' }
  $hosted = [IO.File]::ReadAllText($tout); Remove-Item $tin, $tout -ErrorAction SilentlyContinue }
$base = $w.Replace("`r`n", "`n")
# the website's Worker: the app baked in, and no listener class (Cloudflare gives no practice links to a Worker that implements a Durable Object)
# (the phone home-screen icon and favicons, Nov 3: src/icons baked into the website Worker as base64, by path)
$ictype = @{ '.png' = 'image/png'; '.ico' = 'image/x-icon'; '.webmanifest' = 'application/manifest+json' }
$icons = '{' + ((Get-ChildItem (Join-Path $src 'icons') -File | Where-Object { $ictype.ContainsKey($_.Extension) } | Sort-Object Name | ForEach-Object { '"/' + $_.Name + '":["' + $ictype[$_.Extension] + '","' + [Convert]::ToBase64String([IO.File]::ReadAllBytes($_.FullName)) + '"]' }) -join ',') + '}'
# (Nov 5, faster loading: the page's version stamp (ETag), made from the page itself, so a returning browser keeps its copy until a new build)
$appv = -join ([Security.Cryptography.SHA1]::Create().ComputeHash($utf8.GetBytes($hosted)) | Select-Object -First 8 | ForEach-Object { $_.ToString('x2') })
$appt = (Get-Date).ToUniversalTime().ToString('r') # (and its build time, sent as Last-Modified: Cloudflare keeps that one on web pages)
$w = $base.Replace('__ROLE__', 'site').Replace('__HTML__', (& $js $hosted)).Replace('__ICONS__', $icons).Replace('__APPV__', $appv).Replace('__APPT__', $appt)
$w = [regex]::Replace($w, '/\*@GATEWAY-START\*/[\s\S]*?/\*@GATEWAY-END\*/', '')
# the Discord helper's own Worker "debrief-discord" (wrangler.bot.toml): the listener class and the Discord jobs, no site page and no key hand-over class
$bot = $base.Replace('__ROLE__', 'bot').Replace('__HTML__', '""').Replace('__ICONS__', '{}').Replace('__APPV__', 'bot').Replace('__APPT__', '')
$bot = [regex]::Replace($bot, '/\*@KEYS-START\*/[\s\S]*?/\*@KEYS-END\*/', '')
foreach ($b in $w, $bot) { if ($b -match '__[A-Z_]+_Q__|__HTML__|__ROLE__|__ICONS__|__APPV__|__APPT__|/\*TOPSPEC\*/') { throw 'a Worker still has a placeholder' } }
if (($w -match 'class DiscordGateway') -or ($bot -notmatch 'export class DiscordGateway') -or ($w -notmatch 'export class BotKeys') -or ($bot -match 'class BotKeys')) { throw 'the split between the website Worker and the Discord Worker is wrong' }
New-Item -ItemType Directory -Force (Join-Path $root 'online') | Out-Null
[IO.File]::WriteAllText((Join-Path $root 'online\worker.js'), $w, $utf8)
[IO.File]::WriteAllText((Join-Path $root 'online\bot.js'), $bot, $utf8)
# the design check (Oct 22): warns about new code that breaks notes/Guides/Design system.md; it never stops the build
$dc = 0; try { $dc = & (Join-Path $src 'design-check.ps1') -src $src } catch { Write-Host "  the design check didn't run: $_" }
# the contradiction check (Nov 5, analysis step 1; notes/Guides/Contradiction check - how it works.md): runs the engine on saved test pulls and
# lists every place the site contradicts itself (a green line that lists misses, counts that don't add up, two health numbers for one pull,
# broken sentences, nicknames that aren't nouns). It never stops the build, but a failure prints in red: fix it before you push.
# (about 20 s; skip it with $env:DEBRIEF_SKIP_CHECK = '1')
$cc = 'skipped'; $ctest = Join-Path $root 'tests\contradictions.js'
if ((Test-Path $node) -and (Test-Path $ctest) -and -not $env:DEBRIEF_SKIP_CHECK) {
  $cout = & $node --max-old-space-size=8192 $ctest; $ccode = $LASTEXITCODE
  if ($ccode) { $cout | ForEach-Object { Write-Host ("  " + $_) -ForegroundColor Red }; Write-Host '  CONTRADICTION CHECK FAILED: the site contradicts itself (the lines above). Fix it before you push.' -ForegroundColor Red; $cc = 'FAILED, see above' }
  else { $cc = (($cout | Select-Object -Last 1) -replace '^Contradiction check: ', '') }
}
"app: {0:N0} chars; worker: {1:N0} chars; discord worker: {3:N0} chars; design check: {2}; contradiction check: {4}" -f $html.Length, $w.Length, $(if ($dc) { "$dc warning(s), see above" } else { 'OK' }), $bot.Length, $cc
