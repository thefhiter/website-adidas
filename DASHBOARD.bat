@echo off
title Adidas Store - Admin Dashboard
cd /d "%~dp0"

REM --- Check Node.js is installed ---
node --version >nul 2>&1
if errorlevel 1 (
  echo ============================================================
  echo  [ERROR] Node.js is not installed on this PC.
  echo.
  echo  Download and install it from:  https://nodejs.org
  echo  ^(choose the LTS version^), then run DASHBOARD.bat again.
  echo ============================================================
  echo.
  pause
  exit /b 1
)

echo ============================================================
echo   Adidas Store - ADMIN DASHBOARD
echo.
echo   Opening:   http://localhost:3000/admin.html
echo   Password:  adidas-admin
echo.
echo   Keep this window OPEN while using the dashboard.
echo   Close it to stop the server.
echo.
echo   NOTE: run EITHER START.bat OR DASHBOARD.bat, not both
echo   at the same time (they use the same port).
echo ============================================================
echo.

REM Open the admin page a couple seconds after the server starts
start "" /min cmd /c "timeout /t 2 >nul && start http://localhost:3000/admin.html"

node server.js

echo.
echo Server stopped.
pause
