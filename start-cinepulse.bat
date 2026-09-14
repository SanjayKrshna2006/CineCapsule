@echo off
title CinePulse — All-in-One Movie, Series & Anime Streamer
cd /d "%~dp0"

echo =========================================================================
echo               CINEPULSE STREAMING APP LAUNCHER
echo          Stream Movies, TV Series, and Anime without Ads!
echo =========================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b
)

if not exist node_modules (
    echo [INFO] Installing required dependencies...
    call npm install
)

echo [INFO] Starting CinePulse Dev Server...
echo [INFO] Opening CinePulse in your default browser at http://localhost:3000
echo.

start "" "http://localhost:3000"
call npm run dev

pause
