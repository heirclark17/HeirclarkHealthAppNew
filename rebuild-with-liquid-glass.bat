@echo off
echo ========================================
echo REBUILD WITH LIQUID GLASS
echo ========================================
echo.
echo This will rebuild your app with the native
echo Liquid Glass module for iOS 26.
echo.
echo This may take 5-10 minutes...
echo.

cd /d "%~dp0"

echo Starting EAS build for iPhone...
eas build -p ios --profile development

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Once the build finishes:
echo 1. Download the .ipa file from the Expo dashboard
echo 2. Open it on your iPhone to install
echo 3. Your tab bar will have authentic iOS 26 Liquid Glass!
echo.
pause
