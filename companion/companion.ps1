# Debrief Companion: the small PC app that feeds the Debrief addon in WoW.
# It watches your combat log; when a boss pull ends, its window reads the pull with Debrief's own engine and puts a short
# code on your clipboard with a sound. In game, press your Debrief key and Ctrl+V: your recap card shows.
# Nothing here touches the game: it only reads WoWCombatLog files and writes to the clipboard.
param([switch]$NoWindow)
$ErrorActionPreference = 'Stop'
$port = 8772
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

# Fast line scanner (compiled once): finds the ENCOUNTER_START / ENCOUNTER_END lines of a combat log and their byte offsets.
Add-Type -TypeDefinition @'
using System; using System.IO; using System.Text;
public static class DbfScan {
  static string Esc(string s) { var b = new StringBuilder(s.Length + 8); foreach (char c in s) { if (c == '"' || c == '\\') { b.Append('\\'); b.Append(c); } else if (c < 32) b.Append(' '); else b.Append(c); } return b.ToString(); }
  public static string Scan(string path, long from) {
    var sb = new StringBuilder(); sb.Append("{\"items\":[");
    bool first = true; long done;
    using (var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete, 1 << 16)) {
      long len = fs.Length; if (from < 0 || from > len) from = 0; done = from;
      fs.Seek(from, SeekOrigin.Begin);
      byte[] buf = new byte[1 << 22]; byte[] head = new byte[600]; int hn = 0;
      long lineStart = from, abs = from; int n;
      while ((n = fs.Read(buf, 0, buf.Length)) > 0) {
        for (int i = 0; i < n; i++) {
          byte c = buf[i];
          if (c == 10) {
            if (hn > 24) {
              int lim = Math.Min(hn - 12, 64);
              for (int k = 0; k < lim; k++) {
                if (head[k] == 32 && head[k + 1] == 32 && head[k + 2] == 69 && head[k + 3] == 78 && head[k + 4] == 67 && head[k + 11] == 95) {
                  string t = Encoding.UTF8.GetString(head, 0, hn).TrimEnd('\r');
                  if (!first) sb.Append(','); first = false;
                  sb.Append("{\"o\":").Append(lineStart).Append(",\"e\":").Append(abs + i + 1).Append(",\"t\":\"").Append(Esc(t)).Append("\"}");
                  break;
                }
              }
            }
            lineStart = abs + i + 1; done = lineStart; hn = 0;
          } else if (hn < head.Length) head[hn++] = c;
        }
        abs += n;
      }
      sb.Append("],\"done\":").Append(done).Append(",\"size\":").Append(len).Append('}');
    }
    return sb.ToString();
  }
}
'@

$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try { $listener.Start() } catch { Write-Host "Debrief Companion is already running (port $port in use). Opening its window."; Start-Process "http://localhost:$port/"; exit }
Write-Host "Debrief Companion is running at http://localhost:$port"
Write-Host "Keep this window open during raid. Close it to stop."

$handler = {
  param($ctx, $here)
  $ErrorActionPreference = 'Stop'
  $req = $ctx.Request; $res = $ctx.Response
  function Send($res, [byte[]]$bytes, $type) { $res.ContentType = $type; $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length) }
  function SendJson($res, $obj) { Send $res ([Text.Encoding]::UTF8.GetBytes(($obj | ConvertTo-Json -Compress -Depth 5))) 'application/json' }
  function Find-LogsDir {
    foreach ($own in (Join-Path $here 'logs-path.txt'), (Join-Path (Split-Path $here -Parent) 'logs-path.txt')) {
      if (Test-Path $own) { $d = (Get-Content $own -Raw).Trim(); if ($d -and (Test-Path $d)) { return $d } }
    }
    foreach ($k in 'HKLM:\SOFTWARE\WOW6432Node\Blizzard Entertainment\World of Warcraft', 'HKLM:\SOFTWARE\Blizzard Entertainment\World of Warcraft') {
      try { $ip = (Get-ItemProperty $k -ErrorAction Stop).InstallPath; if ($ip) { foreach ($d in (Join-Path $ip 'Logs'), (Join-Path $ip '_retail_\Logs'), (Join-Path (Split-Path $ip -Parent) '_retail_\Logs')) { if (Test-Path $d) { return $d } } } } catch {}
    }
    foreach ($drv in (Get-PSDrive -PSProvider FileSystem).Root) {
      foreach ($sub in 'Program Files (x86)\World of Warcraft\_retail_\Logs', 'Program Files\World of Warcraft\_retail_\Logs', 'World of Warcraft\_retail_\Logs', 'Games\World of Warcraft\_retail_\Logs', 'Blizzard\World of Warcraft\_retail_\Logs', 'Battle.net\World of Warcraft\_retail_\Logs') {
        $d = Join-Path $drv $sub; if (Test-Path $d) { return $d }
      }
    }
    return $null
  }
  function Find-Log($name) {
    if ($name -notmatch '^(Archive-)?WoWCombatLog[^\\/:*?"<>|]*\.txt$') { throw 'Not a combat log.' }
    $d = Find-LogsDir; if (-not $d) { throw 'No WoW Logs folder found.' }
    foreach ($p in (Join-Path $d $name), (Join-Path (Join-Path $d 'warcraftlogsarchive') $name)) { if (Test-Path -LiteralPath $p) { return $p } }
    throw 'That combat log is gone.'
  }
  try {
    $path = $req.Url.AbsolutePath
    $q = $req.QueryString
    if ($req.HttpMethod -eq 'GET' -and ($path -eq '/' -or $path -eq '/index.html')) {
      Send $res ([IO.File]::ReadAllBytes((Join-Path $here 'companion.html'))) 'text/html; charset=utf-8'
    }
    elseif ($req.HttpMethod -eq 'GET' -and $path -match '^/([a-z0-9-]+\.js)$') {
      Send $res ([IO.File]::ReadAllBytes((Join-Path $here $Matches[1]))) 'text/javascript; charset=utf-8'
    }
    elseif ($req.HttpMethod -eq 'GET' -and $path -eq '/app') {
      # Debrief itself (its engine reads each pull): the copy next to this app, or the one in the folder above
      $f = Join-Path $here 'Debrief.html'; if (-not (Test-Path $f)) { $f = Join-Path (Split-Path $here -Parent) 'WoW-Log-Analyzer.html' }
      Send $res ([IO.File]::ReadAllBytes($f)) 'text/html; charset=utf-8'
    }
    elseif ($req.HttpMethod -eq 'GET' -and $path -eq '/logs') {
      $d = Find-LogsDir
      if (-not $d) { SendJson $res @{ error = 'nodir' } }
      else {
        $files = @()
        foreach ($f in @(Get-ChildItem -LiteralPath $d -Filter 'WoWCombatLog*.txt' -File)) { $files += @{ name = $f.Name; size = $f.Length; mtime = [long]($f.LastWriteTimeUtc - [datetime]'1970-01-01').TotalMilliseconds; old = $false } }
        $arc = Join-Path $d 'warcraftlogsarchive'
        if (Test-Path $arc) { foreach ($f in @(Get-ChildItem -LiteralPath $arc -Filter 'Archive-WoWCombatLog*.txt' -File)) { $files += @{ name = $f.Name; size = $f.Length; mtime = [long]($f.LastWriteTimeUtc - [datetime]'1970-01-01').TotalMilliseconds; old = $true } } }
        SendJson $res @{ dir = $d; files = @($files | Sort-Object { $_.mtime } -Descending) }
      }
    }
    elseif ($req.HttpMethod -eq 'GET' -and $path -eq '/scan') {
      $p = Find-Log $q['name']; $from = [long]$q['from']
      Send $res ([Text.Encoding]::UTF8.GetBytes([DbfScan]::Scan($p, $from))) 'application/json'
    }
    elseif ($req.HttpMethod -eq 'GET' -and $path -eq '/read') {
      $p = Find-Log $q['name']; $from = [long]$q['from']; $to = [long]$q['to']
      $fs = New-Object IO.FileStream($p, [IO.FileMode]::Open, [IO.FileAccess]::Read, ([IO.FileShare]::ReadWrite -bor [IO.FileShare]::Delete))
      try {
        if ($to -gt $fs.Length) { $to = $fs.Length }
        $n = [int][Math]::Max(0, [Math]::Min($to - $from, 16MB))
        $buf = New-Object byte[] $n; [void]$fs.Seek($from, 'Begin'); $got = 0
        while ($got -lt $n) { $k = $fs.Read($buf, $got, $n - $got); if ($k -le 0) { break }; $got += $k }
        if ($got -lt $n) { $short = New-Object byte[] $got; [Array]::Copy($buf, $short, $got); $buf = $short }
        Send $res $buf 'application/octet-stream'
      } finally { $fs.Dispose() }
    }
    elseif ($req.HttpMethod -eq 'GET' -and $path -eq '/wait') {
      # waits (up to 25 s) for the combat log to grow, or for a newer combat log to appear
      $d = Find-LogsDir; $name = $q['name']; $size = [long]$q['size']; $t0 = Get-Date
      $out = @{ size = $size; name = $name }
      while (((Get-Date) - $t0).TotalSeconds -lt 25) {
        $f = Get-ChildItem -LiteralPath $d -Filter 'WoWCombatLog*.txt' -File | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
        if ($f -and $f.Name -ne $name) { $out = @{ size = $f.Length; name = $f.Name; newfile = $true }; break }
        if ($f -and $f.Length -ne $size) { $out = @{ size = $f.Length; name = $f.Name }; break }
        Start-Sleep -Milliseconds 700
      }
      SendJson $res $out
    }
    elseif ($req.HttpMethod -eq 'POST' -and $path -eq '/clip') {
      if ($req.ContentType -notlike 'application/json*') { throw 'Expected JSON.' }
      $body = (New-Object IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)).ReadToEnd() | ConvertFrom-Json
      $ok = $false
      try { Set-Clipboard -Value ([string]$body.text); $ok = $true } catch {}
      if (-not $ok) {
        # (fallback: clip.exe, fed UTF-16 so names like Flëxørçïst survive)
        $pi = New-Object Diagnostics.ProcessStartInfo 'clip.exe'; $pi.UseShellExecute = $false; $pi.RedirectStandardInput = $true; $pi.CreateNoWindow = $true
        $pr = [Diagnostics.Process]::Start($pi); $bytes = [Text.Encoding]::Unicode.GetPreamble() + [Text.Encoding]::Unicode.GetBytes([string]$body.text)
        $pr.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length); $pr.StandardInput.Close(); $pr.WaitForExit(3000) | Out-Null; $ok = $true
      }
      if ($body.sound) {
        foreach ($w in "$env:WINDIR\Media\Windows Notify System Generic.wav", "$env:WINDIR\Media\Windows Notify Calendar.wav", "$env:WINDIR\Media\chimes.wav") {
          if (Test-Path $w) { try { (New-Object Media.SoundPlayer $w).PlaySync() } catch {}; break }
        }
      }
      SendJson $res @{ ok = $ok }
    }
    elseif ($req.HttpMethod -eq 'GET' -and $path -eq '/addon') {
      # puts the Debrief addon into WoW's AddOns folder (or updates it), so nobody has to copy folders by hand
      $src = Join-Path $here 'addon\Debrief'; $d = Find-LogsDir; $msg = ''
      if (-not (Test-Path $src)) { $msg = '' }
      elseif (-not $d) { $msg = "Couldn't find WoW to install the addon. Copy the addon's Debrief folder into World of Warcraft\_retail_\Interface\AddOns." }
      else {
        $dst = Join-Path (Split-Path $d -Parent) 'Interface\AddOns\Debrief'
        $v = ((Get-Content -LiteralPath (Join-Path $src 'Debrief.toc')) -match '^## Version:' | Select-Object -First 1) -replace '^## Version:\s*', ''
        $same = (Test-Path (Join-Path $dst 'Debrief.lua')) -and ((Get-FileHash (Join-Path $dst 'Debrief.lua')).Hash -eq (Get-FileHash (Join-Path $src 'Debrief.lua')).Hash)
        if ($same) { $msg = "The Debrief addon is installed in WoW (version $v)." }
        else {
          try {
            New-Item -ItemType Directory -Force -Path $dst | Out-Null
            Copy-Item -Path (Join-Path $src '*') -Destination $dst -Recurse -Force
            $msg = "Installed the Debrief addon in WoW (version $v). If WoW is open, type /reload."
          } catch { $msg = "Couldn't install the addon (" + $_.Exception.Message + "). Copy the addon's Debrief folder into " + (Split-Path $dst -Parent) + "." }
        }
      }
      SendJson $res @{ msg = $msg }
    }
    elseif ($req.HttpMethod -eq 'POST' -and $path -eq '/folder') {
      if ($req.ContentType -notlike 'application/json*') { throw 'Expected JSON.' }
      $body = (New-Object IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)).ReadToEnd() | ConvertFrom-Json
      $d = ([string]$body.dir).Trim().Trim('"')
      if ($d -and (Test-Path -LiteralPath (Join-Path $d '_retail_\Logs'))) { $d = Join-Path $d '_retail_\Logs' }
      elseif ($d -and ($d -notmatch 'Logs\\?$') -and (Test-Path -LiteralPath (Join-Path $d 'Logs'))) { $d = Join-Path $d 'Logs' }
      if (-not $d -or -not (Test-Path -LiteralPath $d)) { throw "That folder doesn't exist." }
      Set-Content -LiteralPath (Join-Path $here 'logs-path.txt') -Value $d -Encoding UTF8
      SendJson $res @{ ok = $true; dir = $d }
    }
    else { $res.StatusCode = 404; Send $res ([Text.Encoding]::UTF8.GetBytes('Not found')) 'text/plain' }
  }
  catch {
    try { $res.StatusCode = 500; Send $res ([Text.Encoding]::UTF8.GetBytes((@{ error = $_.Exception.Message } | ConvertTo-Json -Compress))) 'application/json' } catch {}
  }
  finally { try { $res.Close() } catch {} }
}

if (-not $NoWindow -and -not $env:DBF_NO_WINDOW) {
  # its own small window (Edge app mode); the normal browser if Edge isn't there
  $edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($edge) { Start-Process $edge "--app=http://localhost:$port/ --window-size=1100,820" } else { Start-Process "http://localhost:$port/" }
}

$pool = [RunspaceFactory]::CreateRunspacePool(1, 8)
$pool.ApartmentState = 'STA'
$pool.Open()
$jobs = New-Object Collections.ArrayList
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $ps = [PowerShell]::Create(); $ps.RunspacePool = $pool
  [void]$ps.AddScript($handler).AddArgument($ctx).AddArgument($here)
  [void]$jobs.Add(@{ ps = $ps; h = $ps.BeginInvoke() })
  foreach ($j in @($jobs)) { if ($j.h.IsCompleted) { try { $j.ps.EndInvoke($j.h) } catch {}; $j.ps.Dispose(); $jobs.Remove($j) } }
}
