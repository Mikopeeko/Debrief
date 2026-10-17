# WoW Log Analyzer local helper.
# Serves the app at http://localhost:8765 and passes Warcraft Logs API requests through,
# because Warcraft Logs does not let browser pages request API tokens directly (CORS).
# Your client ID and secret only ever travel from this PC to warcraftlogs.com.
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$port = 8765
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "WoW Log Analyzer is running at http://localhost:$port"
Write-Host "Keep this window open while you use it. Close it to stop."
Start-Process "http://localhost:$port/"

function Send($res, [byte[]]$bytes, $type) {
  $res.ContentType = $type
  $res.ContentLength64 = $bytes.Length
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext(); $req = $ctx.Request; $res = $ctx.Response
  try {
    $path = $req.Url.AbsolutePath
    if ($req.HttpMethod -eq 'POST' -and $path -eq '/wcl/token') {
      $body = (New-Object IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)).ReadToEnd() | ConvertFrom-Json
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
    $res.StatusCode = 502
    $msg = $_.Exception.Message
    if ($_.Exception.Response) { try { $msg += ' ' + (New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch {} }
    Send $res ([Text.Encoding]::UTF8.GetBytes((@{ error = $msg } | ConvertTo-Json -Compress))) 'application/json'
  }
  finally { $res.Close() }
}
