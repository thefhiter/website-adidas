@echo off
title Adidas Store - Local Server
cd /d "%~dp0"

REM --- Check Node.js is installed ---
node --version >nul 2>&1
if errorlevel 1 (
  echo ============================================================
  echo  [ERROR] Node.js is not installed on this PC.
  echo.
  echo  Download and install it from:  https://nodejs.org
  echo  ^(choose the LTS version^), then run START.bat again.
  echo ============================================================
  echo.
  pause
  exit /b 1
)

echo ============================================================
echo   Adidas Store - starting local server...
echo   When it says "Server running", open:
echo        http://localhost:3000
echo.
echo   (this window also opens it for you automatically)
echo   Keep this window OPEN while using the site.
echo   Close it to stop the server.
echo ============================================================
echo.

REM Open the browser a couple seconds after the server starts
start "" /min cmd /c "timeout /t 2 >nul && start http://localhost:3000"

node server.js

echo.
echo Server stopped.
pause
