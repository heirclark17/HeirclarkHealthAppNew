@echo off
echo ===================================
echo Rebuilding Heirclark iOS App
echo ===================================
echo.
echo Fixed: Removed expo-barcode-scanner (deprecated)
echo Now using: expo-camera with built-in barcode scanning
echo.
echo Starting rebuild...
echo.
cd /d "%~dp0"
eas build -p ios --profile development --clear-cache
echo.
echo Build command completed!
echo.
pause
