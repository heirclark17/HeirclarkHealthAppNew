@echo off
echo ========================================
echo REBUILD WITH REGISTERED DEVICE
echo ========================================
echo.
echo This will create a new build that includes
echo your iPhone's UDID in the provisioning profile.
echo.
echo Make sure you completed device registration first!
echo (If not, run: register-iphone.bat)
echo.
pause
echo.
echo Starting rebuild...
echo.
cd /d "%~dp0"
eas build -p ios --profile development
echo.
echo ========================================
echo Build started!
echo Check Expo dashboard for progress.
echo Install URL will appear when complete.
echo ========================================
echo.
pause
