# Debrief local helper.
# Serves the app at http://localhost:8765 and passes Warcraft Logs API requests through,
# because Warcraft Logs does not let browser pages request API tokens directly (CORS).
# Your client ID and secret only ever travel from this PC to warcraftlogs.com.
# Requests are handled by a small pool of workers, so the app can download several parts of a pull at once.
$ErrorActionPreference = 'Stop'
$port = 8765
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
# Saved Warcraft Logs login: kept outside the project (and OneDrive), secret encrypted for this Windows user.
$credFile = Join-Path $env:LOCALAPPDATA 'AdequateAudits\wcl-login.json'
$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Debrief is running at http://localhost:$port"
Write-Host "Keep this window open while you use it. Close it to stop."
Start-Process "http://localhost:$port/"

# Handles one request; runs on a pool worker, so a slow or failed request never blocks or stops the others.
$handler = {
  param($ctx, $root, $credFile)
  $ErrorActionPreference = 'Stop'
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $req = $ctx.Request; $res = $ctx.Response

  function Send($res, [byte[]]$bytes, $type) {
    $res.ContentType = $type
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  }
  function Get-SavedLogin {
    if (-not (Test-Path $credFile)) { return $null }
    try {
      $j = Get-Content $credFile -Raw | ConvertFrom-Json
      $ss = $j.secret | ConvertTo-SecureString
      $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ss))
      return @{ id = $j.id; secret = $plain }
    } catch { return $null }
  }
  # Live logging: the WoW Logs folder (browsers won't let a page pick files under Program Files, so the helper reads
  # the combat log for it). Read-only, and only WoWCombatLog*.txt files in that folder. A logs-path.txt next to this
  # script overrides the search.
  function Find-LogsDir {
    $own = Join-Path $root 'logs-path.txt'
    if (Test-Path $own) { $d = (Get-Content $own -Raw).Trim(); if ($d -and (Test-Path $d)) { return $d } }
    foreach ($k in 'HKLM:\SOFTWARE\WOW6432Node\Blizzard Entertainment\World of Warcraft', 'HKLM:\SOFTWARE\Blizzard Entertainment\World of Warcraft') {
      try { $ip = (Get-ItemProperty $k -ErrorAction Stop).InstallPath; if ($ip) { foreach ($d in (Join-Path $ip 'Logs'), (Join-Path $ip '_retail_\Logs')) { if (Test-Path $d) { return $d } } } } catch {}
    }
    foreach ($drv in (Get-PSDrive -PSProvider FileSystem).Root) {
      foreach ($sub in 'Program Files (x86)\World of Warcraft\_retail_\Logs', 'Program Files\World of Warcraft\_retail_\Logs', 'World of Warcraft\_retail_\Logs', 'Games\World of Warcraft\_retail_\Logs', 'Blizzard\World of Warcraft\_retail_\Logs') {
        $d = Join-Path $drv $sub; if (Test-Path $d) { return $d }
      }
    }
    return $null
  }
  function Read-Json($req) {
    # JSON-only, so other websites can't post here without a CORS preflight this helper never answers
    if ($req.ContentType -notlike 'application/json*') { throw 'Expected JSON.' }
    return (New-Object IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)).ReadToEnd() | ConvertFrom-Json
  }

  try {
    $path = $req.Url.AbsolutePath
    if ($req.HttpMethod -eq 'GET' -and $path -eq '/version') {
      # the page polls this and reloads itself when the app file is rebuilt
      $v = (Get-Item (Join-Path $root 'WoW-Log-Analyzer.html')).LastWriteTimeUtc.Ticks
      Send $res ([Text.Encoding]::UTF8.GetBytes("$v")) 'text/plain'
    }
    elseif ($req.HttpMethod -eq 'GET' -and $path -eq '/log/info') {
      # the newest combat log: its name and current size
      $d = Find-LogsDir
      $out = if (-not $d) { @{ error = 'nodir' } } else {
        $f = Get-ChildItem -LiteralPath $d -Filter 'WoWCombatLog*.txt' -File | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
        if ($f) { @{ dir = $d; name = $f.Name; size = $f.Length; mtime = [long]($f.LastWriteTimeUtc - [datetime]'1970-01-01').TotalMilliseconds } } else { @{ dir = $d; error = 'nolog' } }
      }
      Send $res ([Text.Encoding]::UTF8.GetBytes(($out | ConvertTo-Json -Compress))) 'application/json'
    }
    elseif ($req.HttpMethod -eq 'GET' -and $path -eq '/log/read') {
      # bytes [from, to) of a combat log, opened so WoW can keep writing to it
      $name = $req.QueryString['name']; $from = [long]$req.QueryString['from']; $to = [long]$req.QueryString['to']
      if ($name -notmatch '^WoWCombatLog[^\\/:*?"<>|]*\.txt$') { throw 'Not a combat log.' }
      $d = Find-LogsDir; if (-not $d) { throw 'No WoW Logs folder found.' }
      $fs = New-Object IO.FileStream((Join-Path $d $name), [IO.FileMode]::Open, [IO.FileAccess]::Read, ([IO.FileShare]::ReadWrite -bor [IO.FileShare]::Delete))
      try {
        if ($to -gt $fs.Length) { $to = $fs.Length }
        $n = [int][Math]::Max(0, [Math]::Min($to - $from, 16MB))
        $buf = New-Object byte[] $n; [void]$fs.Seek($from, 'Begin'); $got = 0
        while ($got -lt $n) { $k = $fs.Read($buf, $got, $n - $got); if ($k -le 0) { break }; $got += $k }
        if ($got -lt $n) { $short = New-Object byte[] $got; [Array]::Copy($buf, $short, $got); $buf = $short }
        Send $res $buf 'application/octet-stream'
      } finally { $fs.Dispose() }
    }
    elseif ($req.HttpMethod -eq 'GET' -and $path -eq '/wcl/login') {
      # never hands the secret back to the page, only whether one is saved
      $s = Get-SavedLogin
      $out = if ($s) { @{ saved = $true; id = $s.id } } else { @{ saved = $false } }
      Send $res ([Text.Encoding]::UTF8.GetBytes(($out | ConvertTo-Json -Compress))) 'application/json'
    }
    elseif ($req.HttpMethod -eq 'POST' -and $path -eq '/wcl/login') {
      $body = Read-Json $req
      if ($body.clear) { if (Test-Path $credFile) { Remove-Item $credFile -Force } }
      elseif ($body.id -and $body.secret) {
        New-Item -ItemType Directory -Force (Split-Path $credFile) | Out-Null
        $enc = ConvertTo-SecureString $body.secret -AsPlainText -Force | ConvertFrom-SecureString
        @{ id = $body.id; secret = $enc } | ConvertTo-Json -Compress | Set-Content $credFile -Encoding UTF8
      }
      Send $res ([Text.Encoding]::UTF8.GetBytes('{"ok":true}')) 'application/json'
    }
    elseif ($req.HttpMethod -eq 'POST' -and $path -eq '/wcl/token') {
      $body = Read-Json $req
      if (-not $body.secret) {
        # no secret typed: use the saved login
        $s = Get-SavedLogin
        if (-not $s) { throw 'No saved login. Enter your client ID and secret.' }
        $body = [pscustomobject]@{ id = $s.id; secret = $s.secret }
      }
      $basic = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$($body.id):$($body.secret)"))
      $r = Invoke-WebRequest -UseBasicParsing -Method Post -Uri 'https://www.warcraftlogs.com/oauth/token' `
        -Headers @{ Authorization = "Basic $basic" } -Body @{ grant_type = 'client_credentials' }
      Send $res ([Text.Encoding]::UTF8.GetBytes($r.Content)) 'application/json'
    }
    elseif ($req.HttpMethod -eq 'POST' -and $path -eq '/wcl/graphql') {
      $body = (New-Object IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)).ReadToEnd()
      $r = Invoke-WebRequest -UseBasicParsing -Method Post -Uri 'https://www.warcraftlogs.com/api/v2/client' `
        -Headers @{ Authorization = $req.Headers['Authorization'] } -ContentType 'application/json; charset=utf-8' `
        -Body ([Text.Encoding]::UTF8.GetBytes($body))
      $bytes = $r.RawContentStream.ToArray()
      Send $res $bytes 'application/json; charset=utf-8'
    }
    else {
      Send $res ([IO.File]::ReadAllBytes((Join-Path $root 'WoW-Log-Analyzer.html'))) 'text/html; charset=utf-8'
    }
  }
  catch {
    # If the page closed mid-reply the response is already gone; skip the error reply.
    try {
      $res.StatusCode = 502
      $msg = $_.Exception.Message
      if ($_.Exception.Response) { try { $msg += ' ' + (New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch {} }
      Send $res ([Text.Encoding]::UTF8.GetBytes((@{ error = $msg } | ConvertTo-Json -Compress))) 'application/json'
    } catch {}
  }
  finally { try { $res.Close() } catch {} }
}

$pool = [RunspaceFactory]::CreateRunspacePool(1, 6)
$pool.Open()
$jobs = New-Object Collections.ArrayList
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $ps = [PowerShell]::Create()
  $ps.RunspacePool = $pool
  [void]$ps.AddScript($handler).AddArgument($ctx).AddArgument($root).AddArgument($credFile)
  [void]$jobs.Add(@{ ps = $ps; h = $ps.BeginInvoke() })
  # tidy up finished workers
  foreach ($j in @($jobs)) { if ($j.h.IsCompleted) { try { $j.ps.EndInvoke($j.h) } catch {}; $j.ps.Dispose(); $jobs.Remove($j) } }
}
