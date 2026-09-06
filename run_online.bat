@echo off
title MawaBro Game Server + Cloudflare Tunnel
echo ==========================================
echo Starting MawaBro Game Online...
echo ==========================================

cd /d "%~dp0\server"
start "MawaBro Backend" cmd /k "node dist/index.js"

timeout /t 2 /nobreak >nul

cd /d "%~dp0"
start "Cloudflare Edge Tunnel" cmd /k "cloudflared.exe tunnel --url http://localhost:3001"

echo Done! Check the Cloudflare Edge Tunnel window for your public https link!
pause
