@echo off
echo ===================================
echo Heirclark iOS Development Build
echo ===================================
echo.
echo This will create an iOS development build you can install on your iPhone.
echo.
echo When prompted:
echo  1. "Create EAS project?" - Type: y
echo  2. "Generate Apple Certificate?" - Type: y
echo  3. "Generate Provisioning Profile?" - Type: y
echo.
echo The build will take 15-20 minutes.
echo.
pause
echo.
echo Starting build...
echo.
cd /d "%~dp0"
eas build -p ios --profile development
echo.
echo Build command completed!
echo Check the output above for the build URL.
echo.
pause
