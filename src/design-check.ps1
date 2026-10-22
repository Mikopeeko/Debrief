# Design check (Oct 22): run by build.ps1 on every build. It warns, and never stops the build, when new code breaks the
# rules in notes/Guides/Design system.md:
#   1. a flag colour that isn't one of the three (the old bright alarm red, the orange "moderate", the second yellow);
#   2. text under 12px in shell.html that wasn't there before. Chart, map and timeline labels may be small (§2): everything
#      already in design-baseline.txt is allowed.
# It prints each warning and returns how many there were. After a small size you meant (a new chart label, say):
#   powershell -File src/design-check.ps1 -update     (writes the current list into design-baseline.txt)
param([string]$src = $PSScriptRoot, [switch]$update)
$read = { param($f) [IO.File]::ReadAllText((Join-Path $src $f)) }
$css = & $read 'shell.html'
$warn = New-Object System.Collections.Generic.List[string]
# 1. the three flags, three colours: the old ones by value (the phase-colour chart, .rcn-pc, isn't a flag)
$banned = '#d4111e|#ff3b46|#e2540f|#ff7a3d|#f07a3a|#ff9e66|#e8b923|#ffd54a|rgba\(\s*212\s*,\s*17\s*,\s*30|rgba\(\s*226\s*,\s*84\s*,\s*15|rgba\(\s*240\s*,\s*122\s*,\s*58|rgba\(\s*232\s*,\s*185\s*,\s*35'
foreach ($f in 'shell.html', 'ui.js', 'guides.js') {
  $n = 0
  foreach ($line in ((& $read $f) -split "`n")) {
    $n++
    if ($line -match $banned -and $line -notmatch 'rcn-pc') { $t = $line.Trim(); $warn.Add(("{0}:{1} a flag colour outside the three ({2}): {3}" -f $f, $n, $Matches[0], $t.Substring(0, [Math]::Min(80, $t.Length)))) }
  }
}
# 2. text under 12px: each CSS rule's selector and size, against the list of the ones already there
$small = New-Object System.Collections.Generic.List[string]
$cssNc = [regex]::Replace($css, '/\*[\s\S]*?\*/', ' ')
foreach ($m in [regex]::Matches($cssNc, '([^{}]+)\{([^{}]*)\}')) {
  $body = $m.Groups[2].Value; $sel = ($m.Groups[1].Value -replace '\s+', ' ').Trim()
  if ($sel.StartsWith('@') -or $sel -match '^(from|to|\d+%)') { continue }
  foreach ($s in [regex]::Matches($body, '(?:font-size\s*:\s*|font\s*:[^;]*?\s)(\d+(?:\.\d+)?)px')) {
    $px = [double]$s.Groups[1].Value
    if ($px -lt 12 -and $px -gt 0) { $small.Add($sel + ' | ' + $px + 'px') }
  }
}
$basePath = Join-Path $src 'design-baseline.txt'
if ($update) {
  $head = '# Text under 12px that the design check allows (chart, map and timeline labels, and what was already there on Oct 22).' + "`n" + '# One rule per line: selector | size. Rebuild it with: powershell -File src/design-check.ps1 -update'
  [IO.File]::WriteAllText($basePath, $head + "`n" + (($small | Sort-Object -Unique) -join "`n") + "`n", (New-Object Text.UTF8Encoding $false))
  Write-Host ("design-baseline.txt: {0} small-text rules recorded" -f ($small | Sort-Object -Unique).Count)
  return 0
}
$base = @{}
if (Test-Path $basePath) { foreach ($l in [IO.File]::ReadAllLines($basePath)) { if ($l -and -not $l.StartsWith('#')) { $base[$l] = 1 } } }
foreach ($s in ($small | Sort-Object -Unique)) { if (-not $base.ContainsKey($s)) { $warn.Add("shell.html: new text under 12px (nothing anyone must read is under 12px; chart and map labels are fine, see -update): $s") } }
foreach ($w in $warn | Select-Object -First 12) { Write-Host ("  design check: " + $w) }
if ($warn.Count -gt 12) { Write-Host ("  design check: ... and {0} more" -f ($warn.Count - 12)) }
return $warn.Count
