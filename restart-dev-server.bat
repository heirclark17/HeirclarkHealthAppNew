@echo off
echo ========================================
echo RESTARTING HEIRCLARK DEV SERVER
echo ========================================
echo.

echo Killing existing dev servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081" ^| findstr "LISTENING"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8082" ^| findstr "LISTENING"') do taskkill /F /PID %%a 2>nul

echo.
echo Clearing Metro bundler cache...
cd /d "%~dp0"
rmdir /s /q .expo 2>nul
rmdir /s /q node_modules\.cache 2>nul

echo.
echo Starting clean dev server...
echo.
npx expo start --dev-client --clear

pause
