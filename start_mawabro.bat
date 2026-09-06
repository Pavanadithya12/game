@echo off
title MawaBro Multiplayer Game
echo ========================================================
echo               Starting MawaBro Game
echo ========================================================
echo.

:: Check if Docker is available and running
docker ps >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [Docker Detected] Starting MawaBro with Docker Compose...
    docker-compose up -d --build
    echo.
    echo MawaBro running in Docker!
    echo Open: http://localhost:5173
    pause
    exit /b 0
)

echo Starting MawaBro local servers...
echo.

:: Start Backend
start "MawaBro Backend (:3001)" cmd /k "cd /d %~dp0server && node dist/index.js"

:: Start Frontend
start "MawaBro Frontend (:5173)" cmd /k "cd /d %~dp0client && npm run dev -- --host 0.0.0.0"

echo Servers started!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo.
echo Opening browser...
timeout /t 2 >nul
start http://localhost:5173
