@echo off
title CineCapsule Launcher
echo ========================================================
echo        STARTING CINECAPSULE STREAMING PLATFORM
echo ========================================================
echo.
echo [1/2] Starting Backend Server on port 4000...
start "CineCapsule Backend" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 2 /nobreak >nul
echo [2/2] Starting Frontend Dev Server on port 3000...
start "CineCapsule Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:4000