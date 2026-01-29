@echo off
echo ========================================
echo HEIRCLARK DEV SERVER
echo ========================================
echo.
echo This will show a QR code and connection URL.
echo.
echo On your iPhone:
echo 1. Open the Heirclark app
echo 2. Scan the QR code that appears below
echo 3. OR tap "Enter URL manually" and type the URL shown
echo.
echo Keep this window open while developing!
echo Press Ctrl+C to stop the server.
echo.
echo ========================================
echo.
cd /d "%~dp0"
npx expo start --dev-client
pause
