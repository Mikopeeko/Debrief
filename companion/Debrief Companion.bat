@echo off
rem Starts Debrief Companion: it watches your combat log and copies each pull's recap for the Debrief addon in WoW.
cd /d "%~dp0"
rem an older copy still running would keep the port: close it first
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'companion\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0companion.ps1"
pause
