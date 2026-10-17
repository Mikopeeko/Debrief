@echo off
rem Starts the WoW Log Analyzer helper (needed for Warcraft Logs reports) and opens the app.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
