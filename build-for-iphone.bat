@echo off
echo ========================================
echo BUILD FOR PHYSICAL IPHONE
echo ========================================
echo.
echo This build will work on your actual iPhone!
echo (Not simulator - that was the problem before)
echo.
echo You will need to enter:
echo   1. Apple ID: derrick88clark@yahoo.com
echo   2. Apple Password
echo   3. 2FA code from your iPhone
echo.
echo The build takes 10-15 minutes after you enter credentials.
echo.
pause
echo.
cd /d "%~dp0"
eas build -p ios --profile development
echo.
echo ========================================
echo Build complete!
echo Open the install URL on your iPhone.
echo ========================================
echo.
pause
