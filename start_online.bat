@echo off
title MawaBro - Skribbl Online Game Launcher
echo ===================================================
echo        Starting MawaBro Multiplayer Game...
echo ===================================================
cd /d "%~dp0\server"

echo [1/2] Launching MawaBro Unified Game Server on Port 3001...
start "MawaBro Server" node dist/index.js

timeout /t 3 /nobreak >nul

echo [2/2] Exposing to Public Internet via Secure TLS Tunnel...
echo.
echo ===================================================
echo Keep this window open while playing online!
echo Your public HTTPS link will appear below:
echo ===================================================
echo.
ssh -o StrictHostKeyChecking=no -R 80:localhost:3001 nokey@localhost.run
pause
