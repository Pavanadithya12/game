@echo off
cd /d "%~dp0"
echo Starting MawaBro 24/7 Background Service...
start /b npm start
timeout /t 5 /nobreak >nul
start /b ssh -o StrictHostKeyChecking=no -R 80:localhost:3001 nokey@localhost.run
echo MawaBro running in background!
