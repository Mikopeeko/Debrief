@echo off
rem Starts the Debrief helper (needed for Warcraft Logs reports and live logging) and opens the app.
cd /d "%~dp0"
rem an older helper still running would keep the port, so the new one couldn't start: close it first
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'server\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
