@echo off
echo Clearing Expo and Metro cache...
cd /d "%~dp0"

echo.
echo [1/4] Stopping Metro bundler...
taskkill /F /IM node.exe 2>nul

echo.
echo [2/4] Clearing Metro bundler cache...
npx expo start -c

echo.
echo [3/4] Clearing React Native cache...
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q .expo 2>nul
del /f /q .expo-shared\* 2>nul

echo.
echo [4/4] Restarting with fresh cache...
echo Run: npx expo start --clear
echo.
pause
